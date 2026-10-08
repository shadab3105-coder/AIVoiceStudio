// Usage: node scripts/try-voices.mjs <search word> [how many]
// Example: node scripts/try-voices.mjs indian 5
// Searches the Fish Audio voice library and saves one short sample mp3 per voice into ./voice-samples
// so you can listen and pick the voice ID you like.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const term = process.argv[2] || 'indian';
const count = Number(process.argv[3]) || 5;
const text = 'Hello! This is a short sample so you can hear how this voice sounds. Have a wonderful day.';

const base = process.env.FISH_API_BASE || 'https://api.fish.audio';
const key = (process.env.TTS_API_KEY || '').trim();
if (!key) {
  console.error('TTS_API_KEY is missing in .env');
  process.exit(1);
}
const auth = { Authorization: `Bearer ${key}` };

const search = await fetch(`${base}/model?title=${encodeURIComponent(term)}&language=en&page_size=${count}`, { headers: auth });
if (!search.ok) {
  console.error('Voice search failed:', search.status, (await search.text()).slice(0, 200));
  process.exit(1);
}
const { items = [] } = await search.json();
if (!items.length) {
  console.log(`No voices found for "${term}". Try another word.`);
  process.exit(0);
}

fs.mkdirSync('voice-samples', { recursive: true });
for (const [i, voice] of items.entries()) {
  const res = await fetch(`${base}/v1/tts`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json', model: process.env.TTS_MODEL || 's2-pro' },
    body: JSON.stringify({ text, format: 'mp3', reference_id: voice._id }),
  });
  if (!res.ok) {
    console.log(`${i + 1}. FAILED (${res.status}) | ${voice._id} | ${voice.title}`);
    continue;
  }
  const file = path.join('voice-samples', `${term}-${i + 1}.mp3`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log(`${i + 1}. ${file} | ${voice._id} | ${voice.title}`);
}
console.log('\nOpen the voice-samples folder, listen, then copy the ID of the one you like.');