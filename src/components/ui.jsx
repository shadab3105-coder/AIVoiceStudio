import React from 'react';

const ICONS = {
  mic: ['M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z', 'M19 10v2a7 7 0 0 1-14 0v-2', 'M12 19v3'],
  wave: ['M2 10v3', 'M6 6v11', 'M10 3v18', 'M14 8v9', 'M18 5v14', 'M22 10v3'],
  smile: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M8 14s1.5 2 4 2 4-2 4-2', 'M9 9h.01', 'M15 9h.01'],
  book: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z'],
  upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6'],
  check: ['M20 6L9 17l-5-5'],
  x: ['M18 6L6 18', 'M6 6l12 12'],
};

export function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {(ICONS[name] || []).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export function Spinner({ className = 'h-4 w-4' }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-white/30 border-t-white ${className}`} role="status" aria-label="Loading" />;
}

export function Card({ children, className = '' }) {
  return <section className={`rounded-2xl border border-white/10 bg-ink-800/60 p-5 shadow-xl backdrop-blur-sm sm:p-6 ${className}`}>{children}</section>;
}

export function Button({ variant = 'primary', loading = false, disabled, children, className = '', ...props }) {
  const styles = {
    primary: 'bg-linear-to-r from-indigo-500 to-violet-500 text-white shadow-glow hover:from-indigo-400 hover:to-violet-400',
    ghost: 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10',
    danger: 'border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20',
  };
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-200">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-white/10 bg-ink-900/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-hidden transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30';

export function VoicePicker({ voices, value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Voice">
      {voices.map((v) => {
        const active = v.id === value;
        return (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v.id)}
            className={`rounded-xl border px-3 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              active ? 'border-indigo-400 bg-indigo-500/15' : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <span className="block truncate text-sm font-semibold">{v.name}</span>
            <span className="block truncate text-xs text-slate-400">{v.style}</span>
          </button>
        );
      })}
    </div>
  );
}

export const EMOTION_COLORS = {
  neutral: 'bg-slate-500/20 text-slate-200 border-slate-400/30',
  happy: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
  sad: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
  angry: 'bg-red-500/20 text-red-200 border-red-400/30',
  calm: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  excited: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/30',
  whisper: 'bg-violet-500/20 text-violet-200 border-violet-400/30',
};

export function EmotionBadge({ emotion }) {
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral}`}>{emotion}</span>;
}

export function formatDuration(ms) {
  if (ms == null) return null;
  return `${(ms / 1000).toFixed(1)}s`;
}
