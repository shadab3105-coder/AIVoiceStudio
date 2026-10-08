import crypto from 'node:crypto';
import { encodeWav } from '../wav.js';

const SAMPLE_RATE = 22050;

// Per-emotion tone shaping. This is DEMO audio (synthetic tones), not speech.
const EMOTION_STYLE = {
  neutral: { pitch: 1.0, tempo: 1.0, amp: 0.5, wave: 'sine' },
  happy: { pitch: 1.25, tempo: 1.1, amp: 0.55, wave: 'sine' },
  sad: { pitch: 0.8, tempo: 0.75, amp: 0.4, wave: 'sine' },
  angry: { pitch: 1.0, tempo: 1.3, amp: 0.65, wave: 'saw' },
  calm: { pitch: 0.9, tempo: 0.85, amp: 0.4, wave: 'sine' },
  excited: { pitch: 1.4, tempo: 1.4, amp: 0.6, wave: 'saw' },
  whisper: { pitch: 1.0, tempo: 0.95, amp: 0.15, wave: 'noise' },
};

function hashNumber(str) {
  const h = crypto.createHash('sha1').update(String(str)).digest();
  return h.readUInt16BE(0) / 65535;
}

function voicePitch(voice) {
  // Each voice id maps to a stable pitch between 0.7x and 1.5x.
  return 0.7 + hashNumber(voice) * 0.8;
}

function oscillator(wave, phase) {
  switch (wave) {
    case 'saw':
      return 2 * (phase - Math.floor(phase + 0.5));
    case 'noise':
      return Math.random() * 2 - 1;
    default:
      return Math.sin(2 * Math.PI * phase);
  }
}

export function synthesizeDemo({ segments, voice = 'aria', speed = 1 }) {
  const chunks = [];
  const basePitch = 180 * voicePitch(voice);
  for (const segment of segments) {
    const style = EMOTION_STYLE[segment.emotion] || EMOTION_STYLE.neutral;
    const charMs = 75 / (style.tempo * speed);
    for (const ch of segment.text) {
      const ms = /\s/.test(ch) ? charMs * 0.8 : /[.,!?;:]/.test(ch) ? charMs * 2.5 : charMs;
      const n = Math.max(1, Math.floor((ms / 1000) * SAMPLE_RATE));
      const chunk = new Float32Array(n);
      const silent = /[\s.,!?;:]/.test(ch);
      if (!silent) {
        const semitone = (ch.toLowerCase().charCodeAt(0) % 12) - 6;
        const freq = basePitch * style.pitch * Math.pow(2, semitone / 12);
        let phase = 0;
        for (let i = 0; i < n; i++) {
          phase += freq / SAMPLE_RATE;
          const env = Math.min(1, i / (n * 0.15)) * Math.min(1, (n - i) / (n * 0.3));
          chunk[i] = oscillator(style.wave, phase) * style.amp * env;
        }
      }
      chunks.push(chunk);
    }
    chunks.push(new Float32Array(Math.floor(0.12 * SAMPLE_RATE))); // short pause between segments
  }
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const all = new Float32Array(total);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.length;
  }
  return encodeWav(all, SAMPLE_RATE);
}

export function createMockProvider() {
  return {
    name: 'mock',
    async synthesize({ segments, voice, speed }) {
      return { audio: synthesizeDemo({ segments, voice, speed }), mime: 'audio/wav' };
    },
    async cloneVoice({ name }) {
      return { voiceId: `clone-${crypto.randomBytes(4).toString('hex')}`, name };
    },
  };
}
