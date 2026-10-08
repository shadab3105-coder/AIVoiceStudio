import React, { useState } from 'react';
import { api } from '../api.js';
import AudioCard from '../components/AudioCard.jsx';
import { Button, Card, Field, Icon, VoicePicker, inputClass } from '../components/ui.jsx';

const MAX = 2000;
const SAMPLES = [
  'Welcome to Voice Studio. Type anything and hear it spoken in seconds.',
  'Good morning everyone, here is your quick summary of today.',
  'Thank you for calling. Your order has shipped and will arrive on Friday.',
];

export default function TextToSpeech({ voices, onGenerated, notify }) {
  const [text, setText] = useState(SAMPLES[0]);
  const [voice, setVoice] = useState(voices[0]?.id || 'aria');
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setLoading(true);
    try {
      const entry = await api.tts({ text, voice, speed });
      setResult(entry);
      onGenerated(entry);
      notify('success', 'Audio generated');
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const empty = !text.trim();

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="space-y-5 lg:col-span-3">
        <Field label="Your text">
          <textarea
            className={`${inputClass} min-h-[180px] resize-y`}
            value={text}
            maxLength={MAX}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste the text you want spoken..."
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {SAMPLES.map((s, i) => (
              <button key={s} type="button" onClick={() => setText(s)} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-white/10">
                Example {i + 1}
              </button>
            ))}
            <span className="ml-auto text-xs text-slate-400">
              {text.length}/{MAX}
            </span>
          </div>
        </Field>

        <Field label="Voice">
          <VoicePicker voices={voices} value={voice} onChange={setVoice} />
        </Field>

        <Field label={`Speed: ${speed.toFixed(2)}x`}>
          <input type="range" min="0.5" max="2" step="0.05" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full" />
        </Field>

        <Button onClick={generate} loading={loading} disabled={empty} className="w-full sm:w-auto">
          <Icon name="wave" className="h-4 w-4" /> {loading ? 'Generating...' : 'Generate speech'}
        </Button>
      </Card>

      <div className="lg:col-span-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Result</h2>
          {result ? (
            <AudioCard entry={result} autoPlay />
          ) : (
            <div className="grid place-items-center rounded-xl border border-dashed border-white/10 py-14 text-center text-sm text-slate-400">
              <Icon name="wave" className="mb-3 h-8 w-8 text-slate-500" />
              Your generated audio will appear here.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
