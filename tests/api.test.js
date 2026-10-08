import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';
import { createMockProvider } from '../server/providers/mock.js';

const dataDir = path.resolve('.test-data');
let app;

beforeAll(() => fs.rmSync(dataDir, { recursive: true, force: true }));
beforeEach(() => {
  app = createApp({ provider: createMockProvider(), dataDir });
});
afterAll(() => fs.rmSync(dataDir, { recursive: true, force: true }));

const wavSample = () => Buffer.from('RIFFdemo');

describe('health and voices', () => {
  it('reports health with provider name', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, provider: 'mock' });
  });

  it('lists 4 built-in voices', async () => {
    const res = await request(app).get('/api/voices');
    expect(res.body.voices).toHaveLength(4);
    expect(res.body.voices.every((v) => v.builtin)).toBe(true);
  });
});

describe('POST /api/tts', () => {
  it('rejects empty text', async () => {
    const res = await request(app).post('/api/tts').send({ text: '   ' });
    expect(res.status).toBe(400);
  });

  it('rejects text that is too long', async () => {
    const res = await request(app).post('/api/tts').send({ text: 'a'.repeat(2001) });
    expect(res.status).toBe(400);
  });

  it('rejects unknown voice and bad speed', async () => {
    expect((await request(app).post('/api/tts').send({ text: 'hi', voice: 'nobody' })).status).toBe(400);
    expect((await request(app).post('/api/tts').send({ text: 'hi', speed: 5 })).status).toBe(400);
  });

  it('generates a playable WAV and stores it in history', async () => {
    const res = await request(app).post('/api/tts').send({ text: 'Hello there', voice: 'leo' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ voice: 'leo', voiceName: 'Leo', mime: 'audio/wav' });
    expect(res.body.durationMs).toBeGreaterThan(300);

    const audio = await request(app).get(res.body.audioUrl).buffer(true).parse((r, cb) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => cb(null, Buffer.concat(chunks)));
    });
    expect(audio.status).toBe(200);
    expect(audio.headers['content-type']).toContain('audio/wav');
    expect(audio.body.toString('ascii', 0, 4)).toBe('RIFF');

    const history = await request(app).get('/api/history');
    expect(history.body.history).toHaveLength(1);
  });

  it('detects emotion tags and makes longer audio for sad than happy', async () => {
    const mixed = await request(app).post('/api/tts').send({ text: '[happy] Great news. [sad] Sorry about that.' });
    expect(mixed.body.emotions).toEqual(['happy', 'sad']);

    const happy = await request(app).post('/api/tts').send({ text: '[happy] Same words here' });
    const sad = await request(app).post('/api/tts').send({ text: '[sad] Same words here' });
    expect(sad.body.durationMs).toBeGreaterThan(happy.body.durationMs);
  });

  it('gives different voices different audio', async () => {
    const a = await request(app).post('/api/tts').send({ text: 'Same text', voice: 'aria' });
    const b = await request(app).post('/api/tts').send({ text: 'Same text', voice: 'leo' });
    const read = (entry) => fs.readFileSync(path.join(dataDir, 'audio', entry.file));
    expect(read(a.body).equals(read(b.body))).toBe(false);
  });
});

describe('POST /api/clone', () => {
  it('requires a name and a sample', async () => {
    expect((await request(app).post('/api/clone').field('name', '')).status).toBe(400);
    expect((await request(app).post('/api/clone').field('name', 'Me')).status).toBe(400);
  });

  it('rejects non-audio uploads', async () => {
    const res = await request(app).post('/api/clone').field('name', 'Me').attach('sample', Buffer.from('hello'), { filename: 'a.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });

  it('clones a voice, adds it to the list and renders a preview', async () => {
    const res = await request(app)
      .post('/api/clone')
      .field('name', 'My Voice')
      .field('previewText', 'Testing my new voice')
      .attach('sample', wavSample(), { filename: 'me.wav', contentType: 'audio/wav' });
    expect(res.status).toBe(201);
    expect(res.body.voice).toMatchObject({ name: 'My Voice', builtin: false });
    expect(res.body.preview.voice).toBe(res.body.voice.id);

    const voices = await request(app).get('/api/voices');
    expect(voices.body.voices).toHaveLength(5);

    const tts = await request(app).post('/api/tts').send({ text: 'Using the clone', voice: res.body.voice.id });
    expect(tts.status).toBe(201);
  });
});

describe('deleting', () => {
  it('protects built-in voices but removes cloned ones', async () => {
    expect((await request(app).delete('/api/voices/aria')).status).toBe(400);
    const clone = await request(app).post('/api/clone').field('name', 'Temp').attach('sample', wavSample(), { filename: 'a.wav', contentType: 'audio/wav' });
    expect((await request(app).delete(`/api/voices/${clone.body.voice.id}`)).status).toBe(204);
    expect((await request(app).delete('/api/voices/missing')).status).toBe(404);
  });

  it('removes a history item and its audio file', async () => {
    const tts = await request(app).post('/api/tts').send({ text: 'Delete me' });
    expect((await request(app).delete(`/api/history/${tts.body.id}`)).status).toBe(204);
    expect((await request(app).get(tts.body.audioUrl)).status).toBe(404);
    expect(fs.existsSync(path.join(dataDir, 'audio', tts.body.file))).toBe(false);
  });
});
