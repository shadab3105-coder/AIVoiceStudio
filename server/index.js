import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { createApp } from './app.js';
import { createProvider } from './providers/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// VOICES in .env: JSON list like [{"id":"<voice id>","name":"Indian English","style":"Indian accent"}]
function loadVoices() {
  const raw = process.env.VOICES;
  if (!raw) return undefined;
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || !list.length || !list.every((v) => v && v.id && v.name)) throw new Error('bad shape');
    return list;
  } catch {
    console.warn('VOICES in .env is not valid (need JSON list of {id, name, style}); using default voices.');
    return undefined;
  }
}

const provider = createProvider();
const app = createApp({
  provider,
  dataDir: path.join(root, 'server', 'data'),
  clientDir: path.join(root, 'dist'),
  voices: loadVoices(),
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Voice Studio API on http://localhost:${port} (provider: ${provider.name})`);
});