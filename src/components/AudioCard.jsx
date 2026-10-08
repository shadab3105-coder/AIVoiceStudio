import React from 'react';
import { Button, EmotionBadge, Icon, formatDuration } from './ui.jsx';

const EXT = { 'audio/wav': 'wav', 'audio/mpeg': 'mp3', 'audio/ogg': 'ogg' };

export default function AudioCard({ entry, onDelete, autoPlay = false }) {
  const duration = formatDuration(entry.durationMs);
  const ext = EXT[entry.mime] || 'audio';
  return (
    <article className="rounded-xl border border-white/10 bg-ink-900/70 p-4" data-testid="audio-card">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 font-medium text-indigo-200">{entry.voiceName}</span>
        {entry.emotions.map((e) => (
          <EmotionBadge key={e} emotion={e} />
        ))}
        {duration && <span>{duration}</span>}
        <span className="ml-auto">{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-slate-300">{entry.text}</p>
      <audio controls autoPlay={autoPlay} src={entry.audioUrl} preload="metadata" />
      <div className="mt-3 flex gap-2">
        <a
          href={entry.audioUrl}
          download={`voice-studio-${entry.id.slice(0, 8)}.${ext}`}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
        >
          <Icon name="download" className="h-4 w-4" /> Download
        </a>
        {onDelete && (
          <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => onDelete(entry)}>
            <Icon name="trash" className="h-4 w-4" /> Delete
          </Button>
        )}
      </div>
    </article>
  );
}
