import { createApp } from '../server/app.js';
import { createProvider } from '../server/providers/index.js';

function loadVoices() {
  const raw = process.env.VOICES;
  if (!raw) return undefined;
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || !list.length || !list.every((v) => v && v.id && v.name)) throw new Error('bad shape');
    return list;
  } catch {
    console.warn('VOICES is not valid JSON; using default voices.');
    return undefined;
  }
}

const provider = createProvider();

const app = createApp({
  provider,
  dataDir: '/tmp/voice-studio',
  clientDir: null,
  voices: loadVoices(),
});

export default app;