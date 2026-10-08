import { createApp } from '../server/app.js';
import { createProvider } from '../server/providers/index.js';

const provider = createProvider();

const app = createApp({
  provider,
  dataDir: '/tmp/voice-studio',
  clientDir: null,
});

export default app;