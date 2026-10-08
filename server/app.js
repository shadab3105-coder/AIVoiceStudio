import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { EMOTIONS, parseSegments, usedEmotions } from './emotion.js';
import { wavDurationMs } from './wav.js';

export const MAX_TEXT = 2000;
const MAX_SAMPLE_BYTES = 15 * 1024 * 1024;

const BUILTIN_VOICES = [
  { id: 'aria', name: 'Aria', style: 'Warm, friendly', builtin: true },
  { id: 'leo', name: 'Leo', style: 'Deep, narrator', builtin: true },
  { id: 'mira', name: 'Mira', style: 'Bright, energetic', builtin: true },
  { id: 'kai', name: 'Kai', style: 'Calm, conversational', builtin: true },
];

export function createApp({ provider, dataDir, clientDir, voices: configuredVoices } = {}) {  if (!provider) throw new Error('createApp requires a provider');
  const audioDir = path.join(dataDir, 'audio');
  fs.mkdirSync(audioDir, { recursive: true });

  const voices = (configuredVoices?.length ? configuredVoices : BUILTIN_VOICES).map((v) => ({ style: '', ...v, builtin: true }));
    const history = [];

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SAMPLE_BYTES, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm') return cb(null, true);
      cb(new Error('Sample must be an audio file'));
    },
  });

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  const extFor = (mime) => (mime.includes('wav') ? 'wav' : mime.includes('mpeg') ? 'mp3' : mime.includes('ogg') ? 'ogg' : 'bin');

  async function generate({ text, voice, speed, kind }) {
    const segments = parseSegments(text);
    if (!segments.length) throw Object.assign(new Error('Text is empty'), { status: 400 });
    const { audio, mime } = await provider.synthesize({ text, segments, voice, speed });
    const id = crypto.randomUUID();
    const file = `${id}.${extFor(mime)}`;
    fs.writeFileSync(path.join(audioDir, file), audio);
    const entry = {
      id,
      kind,
      text,
      voice,
      voiceName: voices.find((v) => v.id === voice)?.name || voice,
      emotions: usedEmotions(segments),
      speed,
      mime,
      file,
      durationMs: mime === 'audio/wav' ? wavDurationMs(audio) : null,
      bytes: audio.length,
      createdAt: new Date().toISOString(),
      audioUrl: `/api/audio/${id}`,
    };
    history.unshift(entry);
    return entry;
  }

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, provider: provider.name, voices: voices.length, generated: history.length });
  });

  app.get('/api/emotions', (_req, res) => res.json({ emotions: EMOTIONS }));

  app.get('/api/voices', (_req, res) => res.json({ voices }));

  app.get('/api/history', (_req, res) => res.json({ history }));

  app.post('/api/tts', async (req, res, next) => {
    try {
      const { text, voice = 'aria', speed = 1 } = req.body || {};
      if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Text is required' });
      if (text.length > MAX_TEXT) return res.status(400).json({ error: `Text must be at most ${MAX_TEXT} characters` });
      if (!voices.some((v) => v.id === voice)) return res.status(400).json({ error: `Unknown voice "${voice}"` });
      const s = Number(speed);
      if (!Number.isFinite(s) || s < 0.5 || s > 2) return res.status(400).json({ error: 'Speed must be between 0.5 and 2' });
      const entry = await generate({ text, voice, speed: s, kind: 'tts' });
      res.status(201).json(entry);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/clone', upload.single('sample'), async (req, res, next) => {
    try {
      const name = String(req.body?.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Voice name is required' });
      if (name.length > 40) return res.status(400).json({ error: 'Voice name is too long (max 40)' });
      if (!req.file) return res.status(400).json({ error: 'Audio sample is required' });
      const { voiceId } = await provider.cloneVoice({ name, sample: req.file });
      const voice = { id: voiceId, name, style: 'Cloned voice', builtin: false, createdAt: new Date().toISOString() };
      voices.push(voice);
      const previewText = String(req.body?.previewText || '').trim();
            let preview = null;
      let previewError = null;
      if (previewText) {
        try {
          preview = await generate({ text: previewText, voice: voice.id, speed: 1, kind: 'clone' });
        } catch (err) {
          previewError = err.message;
        }
      }
      res.status(201).json({ voice, preview, previewError });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/audio/:id', (req, res) => {
    const entry = history.find((h) => h.id === req.params.id);
    if (!entry) return res.status(404).json({ error: 'Audio not found' });
    res.setHeader('Content-Type', entry.mime);
    res.sendFile(path.resolve(audioDir, entry.file));
  });

  app.delete('/api/history/:id', (req, res) => {
    const i = history.findIndex((h) => h.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: 'Not found' });
    const [removed] = history.splice(i, 1);
    fs.rmSync(path.join(audioDir, removed.file), { force: true });
    res.status(204).end();
  });

  app.delete('/api/voices/:id', (req, res) => {
    const i = voices.findIndex((v) => v.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: 'Voice not found' });
    if (voices[i].builtin) return res.status(400).json({ error: 'Built-in voices cannot be deleted' });
    voices.splice(i, 1);
    res.status(204).end();
  });

  

  if (clientDir && fs.existsSync(clientDir)) {
    app.use(express.static(clientDir));
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.resolve(clientDir, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : err.message?.includes('audio file') ? 400 : 502);
    res.status(status).json({ error: err.message || 'Something went wrong' });
  });

  return app;
}
