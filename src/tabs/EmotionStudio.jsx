import React, { useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { EMOTIONS, parseSegments } from '../../server/emotion.js';
import AudioCard from '../components/AudioCard.jsx';
import { Button, Card, EMOTION_COLORS, EmotionBadge, Field, Icon, VoicePicker, inputClass } from '../components/ui.jsx';

const DEFAULT_TEXT = "[happy] I can't believe we finished on time! [sad] But the team is leaving tomorrow. [calm] Let's make tonight count.";

export default function EmotionStudio({ voices, onGenerated, notify }) {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [voice, setVoice] = useState(voices[0]?.id || 'aria');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const ref = useRef(null);

  const segments = useMemo(() => parseSegments(text), [text]);

  const insertTag = (tag) => {
    const el = ref.current;
    const start = el ? el.selectionStart : text.length;
    const end = el ? el.selectionEnd : text.length;
    const insert = `[${tag}] `;
    setText(text.slice(0, start) + insert + text.slice(end));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + insert.length, start + insert.length);
    });
  };

  const generate = async () => {
    setLoading(true);
    try {
      const entry = await api.tts({ text, voice, speed: 1 });
      setResult(entry);
      onGenerated(entry);
      notify('success', 'Emotion audio generated');
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="space-y-5 lg:col-span-3">
        <Field label="Script with emotion tags" hint="Place a tag before the words it should affect. It stays active until the next tag.">
          <textarea
            ref={ref}
            className={`${inputClass} min-h-[160px] resize-y font-mono`}
            value={text}
            maxLength={2000}
            onChange={(e) => setText(e.target.value)}
          />
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-200">Insert tag at cursor</span>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => insertTag(e)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${EMOTION_COLORS[e]}`}
              >
                [{e}]
              </button>
            ))}
          </div>
        </div>

        <Field label="Voice">
          <VoicePicker voices={voices} value={voice} onChange={setVoice} />
        </Field>

        <Button onClick={generate} loading={loading} disabled={!segments.length}>
          <Icon name="smile" className="h-4 w-4" /> {loading ? 'Generating...' : 'Generate with emotions'}
        </Button>
      </Card>

      <div className="space-y-6 lg:col-span-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Timeline preview</h2>
          {segments.length ? (
            <ol className="space-y-2" data-testid="segments">
              {segments.map((s, i) => (
                <li key={`${i}-${s.emotion}`} className="rounded-xl border border-white/10 bg-ink-900/70 p-3">
                  <EmotionBadge emotion={s.emotion} />
                  <p className="mt-2 text-sm text-slate-300">{s.text}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-slate-400">Add some text to see how it will be split.</p>
          )}
        </Card>
        {result && (
          <Card>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Result</h2>
            <AudioCard entry={result} autoPlay />
          </Card>
        )}
      </div>
    </div>
  );
}
