// Starts the API in-process, generates sample audio for several cases,
// saves the WAV files and writes test-output/report.md.
import fs from 'node:fs';
import path from 'node:path';
import { createApp } from '../server/app.js';
import { createMockProvider } from '../server/providers/mock.js';

const outDir = path.resolve('test-output');
const dataDir = path.resolve('.test-data-output');
fs.rmSync(outDir, { recursive: true, force: true });
fs.rmSync(dataDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const app = createApp({ provider: createMockProvider(), dataDir });
const server = app.listen(0);
const base = `http://localhost:${server.address().port}`;

const post = (url, body) => fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const cases = [
  { name: '01-plain-aria', text: 'Welcome to Voice Studio.', voice: 'aria' },
  { name: '02-plain-leo', text: 'Welcome to Voice Studio.', voice: 'leo' },
  { name: '03-happy', text: '[happy] This is wonderful news!', voice: 'mira' },
  { name: '04-sad', text: '[sad] I am sorry to hear that.', voice: 'mira' },
  { name: '05-angry', text: '[angry] That is not acceptable.', voice: 'kai' },
  { name: '06-whisper', text: '[whisper] Keep this a secret.', voice: 'kai' },
  { name: '07-mixed', text: 'Hello. [happy] We won! [sad] But we lost a friend. [calm] Let us rest now.', voice: 'aria' },
  { name: '08-fast-speed', text: 'The quick brown fox jumps over the lazy dog.', voice: 'aria', speed: 1.8 },
];

const rows = [];
let failed = 0;
const check = (ok) => {
  if (!ok) failed += 1;
  return ok ? 'PASS' : 'FAIL';
};

for (const c of cases) {
  const res = await post('/api/tts', { text: c.text, voice: c.voice, speed: c.speed ?? 1 });
  const entry = await res.json();
  const audio = Buffer.from(await (await fetch(base + entry.audioUrl)).arrayBuffer());
  fs.writeFileSync(path.join(outDir, `${c.name}.wav`), audio);
  const validWav = audio.toString('ascii', 0, 4) === 'RIFF' && entry.durationMs > 0;
  rows.push(`| ${c.name} | ${c.voice} | ${entry.emotions.join(', ')} | ${entry.durationMs} ms | ${(audio.length / 1024).toFixed(1)} KB | ${check(res.status === 201 && validWav)} |`);
}

// Voice cloning flow
const form = new FormData();
form.append('name', 'Demo Clone');
form.append('previewText', 'This is my cloned voice.');
form.append('sample', new Blob([Buffer.from('RIFFdemo')], { type: 'audio/wav' }), 'sample.wav');
const cloneRes = await fetch(`${base}/api/clone`, { method: 'POST', body: form });
const clone = await cloneRes.json();
const cloneOk = cloneRes.status === 201 && clone.preview?.durationMs > 0;
if (cloneOk) fs.writeFileSync(path.join(outDir, '09-cloned-voice-preview.wav'), Buffer.from(await (await fetch(base + clone.preview.audioUrl)).arrayBuffer()));
rows.push(`| 09-cloned-voice-preview | ${clone.voice?.id ?? '-'} | ${clone.preview?.emotions?.join(', ') ?? '-'} | ${clone.preview?.durationMs ?? '-'} ms | - | ${check(cloneOk)} |`);

// Error handling
const bad = [
  ['empty text', await post('/api/tts', { text: '' }), 400],
  ['unknown voice', await post('/api/tts', { text: 'hi', voice: 'x' }), 400],
  ['text too long', await post('/api/tts', { text: 'a'.repeat(2001) }), 400],
];
const errorRows = bad.map(([label, res, want]) => `| ${label} | HTTP ${res.status} (expected ${want}) | ${check(res.status === want)} |`);

server.close();
fs.rmSync(dataDir, { recursive: true, force: true });

const report = `# Voice Studio test output

Provider: mock (synthetic demo tones, not real speech). Generated: ${new Date().toISOString()}

## Audio generation

| Case | Voice | Emotions | Duration | Size | Result |
| --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

## Error handling

| Case | Response | Result |
| --- | --- | --- |
${errorRows.join('\n')}

**Overall: ${failed === 0 ? 'ALL PASSED' : `${failed} FAILED`}**
`;
fs.writeFileSync(path.join(outDir, 'report.md'), report);
console.log(report);
process.exit(failed === 0 ? 0 : 1);
