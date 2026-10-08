import { createMockProvider } from './mock.js';
import { createHttpProvider } from './http.js';

export function createProvider(env = process.env) {
  const kind = (env.TTS_PROVIDER || 'mock').toLowerCase();
  if (kind === 'http') return createHttpProvider(env);
  if (kind === 'mock') return createMockProvider();
  throw new Error(`Unknown TTS_PROVIDER "${kind}" (use "mock" or "http")`);
}
