import React from 'react';
import AudioCard from '../components/AudioCard.jsx';
import { Button, Card, Icon } from '../components/ui.jsx';

export default function Library({ voices, history, onDeleteVoice, onDeleteEntry }) {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Voices ({voices.length})</h2>
        <ul className="space-y-2">
          {voices.map((v) => (
            <li key={v.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-900/70 px-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-indigo-500 to-violet-500 text-sm font-bold">{v.name[0]?.toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{v.name}</p>
                <p className="truncate text-xs text-slate-400">{v.builtin ? v.style : 'Cloned voice'}</p>
              </div>
              {!v.builtin && (
                <Button variant="danger" className="px-2.5 py-1.5" aria-label={`Delete voice ${v.name}`} onClick={() => onDeleteVoice(v)}>
                  <Icon name="trash" className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="lg:col-span-3">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">History ({history.length})</h2>
        {history.length ? (
          <div className="space-y-3">
            {history.map((entry) => (
              <AudioCard key={entry.id} entry={entry} onDelete={onDeleteEntry} />
            ))}
          </div>
        ) : (
          <div className="grid place-items-center rounded-xl border border-dashed border-white/10 py-14 text-center text-sm text-slate-400">
            <Icon name="book" className="mb-3 h-8 w-8 text-slate-500" />
            Nothing generated yet. Try the Text to Speech tab.
          </div>
        )}
      </Card>
    </div>
  );
}
