import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { Icon } from './components/ui.jsx';
import TextToSpeech from './tabs/TextToSpeech.jsx';
import VoiceCloning from './tabs/VoiceCloning.jsx';
import EmotionStudio from './tabs/EmotionStudio.jsx';
import Library from './tabs/Library.jsx';

const TABS = [
  { id: 'tts', label: 'Text to Speech', icon: 'wave' },
  { id: 'clone', label: 'Voice Cloning', icon: 'mic' },
  { id: 'emotion', label: 'Emotion Studio', icon: 'smile' },
  { id: 'library', label: 'Library', icon: 'book' },
];

export default function App() {
  const [tab, setTab] = useState('tts');
  const [voices, setVoices] = useState([]);
  const [history, setHistory] = useState([]);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((type, message) => {
    setToast({ type, message });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    Promise.all([api.voices(), api.history(), api.health()])
      .then(([v, h, hl]) => {
        setVoices(v);
        setHistory(h);
        setHealth(hl);
      })
      .catch(() => setError('Cannot reach the Voice Studio server. Start it with "npm run dev".'));
    return () => clearTimeout(timer.current);
  }, []);

  const addEntry = useCallback((entry) => setHistory((h) => [entry, ...h.filter((x) => x.id !== entry.id)]), []);
  const addVoice = useCallback((voice) => setVoices((v) => [...v, voice]), []);

  const deleteEntry = async (entry) => {
    try {
      await api.deleteHistory(entry.id);
      setHistory((h) => h.filter((x) => x.id !== entry.id));
    } catch (err) {
      notify('error', err.message);
    }
  };

  const deleteVoice = async (voice) => {
    try {
      await api.deleteVoice(voice.id);
      setVoices((v) => v.filter((x) => x.id !== voice.id));
      notify('success', `Removed "${voice.name}"`);
    } catch (err) {
      notify('error', err.message);
    }
  };

  const demo = health?.provider === 'mock';

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <span className="absolute -left-32 -top-40 h-160 w-160 animate-aurora rounded-full bg-indigo-500 opacity-[.45] blur-[90px] motion-reduce:animate-none" />
        <span className="absolute -right-40 top-1/5 h-144 w-144 animate-aurora rounded-full bg-purple-500 opacity-[.45] blur-[90px] [animation-delay:-6s] [animation-duration:26s] motion-reduce:animate-none" />
        <span className="absolute -bottom-48 left-[30%] h-128 w-128 animate-aurora rounded-full bg-violet-600 opacity-[.45] blur-[90px] [animation-delay:-12s] [animation-duration:32s] motion-reduce:animate-none" />
      </div>
      <header className="mb-8 flex flex-wrap items-center gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-500 shadow-glow">
          <Icon name="wave" className="h-6 w-6 text-white" />
        </div>
        <div> <h1 className="text-2xl font-bold tracking-tight"> VoxQuest <span className="text-xs text-slate-400 font-normal ml-1">An adventurous journey where your words meet the magic of AI voices </span> </h1> <p className="text-sm text-slate-400"> Text to speech, voice cloning and emotion control </p> </div>
        {health && (
          <span
            className={`ml-auto rounded-full border px-3 py-1 text-xs font-medium ${
              demo ? 'border-amber-400/30 bg-amber-500/10 text-amber-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
            }`}
            title={demo ? 'Mock provider: audio is synthetic demo tones, not real speech' : 'Connected to your TTS API'}
          >
            {demo ? 'Demo mode (mock audio)' : `Provider: ${health.provider}`}
          </span>
        )}
      </header>

      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-ink-800/60 p-1.5" role="tablist" aria-label="Sections">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                active ? 'bg-linear-to-r from-indigo-500 to-violet-500 text-white shadow-glow' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <Icon name={t.icon} className="h-4 w-4" />
              {t.label}
              {t.id === 'library' && history.length > 0 && <span className="rounded-full bg-white/20 px-1.5 text-xs">{history.length}</span>}
            </button>
          );
        })}
      </nav>

      {error && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      {voices.length > 0 && (
        <main role="tabpanel">
          {tab === 'tts' && <TextToSpeech voices={voices} onGenerated={addEntry} notify={notify} />}
          {tab === 'clone' && <VoiceCloning onCloned={addVoice} onGenerated={addEntry} notify={notify} />}
          {tab === 'emotion' && <EmotionStudio voices={voices} onGenerated={addEntry} notify={notify} />}
          {tab === 'library' && <Library voices={voices} history={history} onDeleteVoice={deleteVoice} onDeleteEntry={deleteEntry} />}
        </main>
      )}

              <footer className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
        <p>
          &copy; {new Date().getFullYear()} Md Shdab Hussain. All rights reserved.
        </p>
        <p className="mt-1">
          For feedback, contact{' '}
          <a href="mailto:shadabhussain3105@gmail.com" className="font-medium text-indigo-300 hover:text-indigo-200 hover:underline">
            shadabhussain3105@gmail.com
          </a>
        </p>
      </footer>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-sm ${
            toast.type === 'error' ? 'border-red-500/40 bg-red-950/80 text-red-100' : 'border-emerald-500/40 bg-emerald-950/80 text-emerald-100'
          }`}
        >
          <Icon name={toast.type === 'error' ? 'x' : 'check'} className="h-4 w-4 shrink-0" />
          {toast.message}
        </div>
      )}
    </div>
  );
}
