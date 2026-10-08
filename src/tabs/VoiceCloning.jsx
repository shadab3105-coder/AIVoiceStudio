import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import AudioCard from '../components/AudioCard.jsx';
import { Button, Card, Field, Icon, inputClass } from '../components/ui.jsx';

const MAX_MB = 15;

export default function VoiceCloning({ onCloned, onGenerated, notify }) {
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [previewText, setPreviewText] = useState('Hi, this is my cloned voice speaking for the first time.');
  const [dragging, setDragging] = useState(false);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const recorderRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => () => recorderRef.current?.stream?.getTracks().forEach((t) => t.stop()), []);

  const pick = (f) => {
    if (!f) return;
    if (!f.type.startsWith('audio/')) return notify('error', 'Please choose an audio file (wav, mp3, m4a, ogg)');
    if (f.size > MAX_MB * 1024 * 1024) return notify('error', `File is too large (max ${MAX_MB} MB)`);
    setFile(f);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = rec.mimeType || 'audio/webm';
        setFile(new File(chunks, 'recording.webm', { type: type.startsWith('audio/') ? type : 'audio/webm' }));
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      notify('error', 'Microphone is not available or permission was denied');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const submit = async () => {
    const form = new FormData();
    form.append('name', name.trim());
    form.append('sample', file);
    if (previewText.trim()) form.append('previewText', previewText.trim());
    setLoading(true);
    try {
      const data = await api.clone(form);
      setDone(data);
      onCloned(data.voice);
      if (data.preview) onGenerated(data.preview);
      if (data.previewError) notify('error', `Voice "${data.voice.name}" was created, but the preview failed: ${data.previewError}`);
      else notify('success', `Voice "${data.voice.name}" is ready`);
        } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = name.trim() && file && !recording;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="space-y-5 lg:col-span-3">
        <Field label="Voice name">
          <input className={inputClass} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="e.g. My narrator voice" />
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-200">Voice sample</span>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files?.[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className={`grid cursor-pointer place-items-center rounded-xl border-2 border-dashed px-4 py-10 text-center transition ${
              dragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/15 bg-white/5 hover:bg-white/10'
            }`}
          >
            <Icon name="upload" className="mb-2 h-7 w-7 text-indigo-300" />
            {file ? (
              <p className="text-sm font-medium text-slate-100" data-testid="file-name">
                {file.name} <span className="text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
              </p>
            ) : (
              <p className="text-sm text-slate-300">Drop an audio file here, or click to browse</p>
            )}
            <p className="mt-1 text-xs text-slate-400">10 to 60 seconds of clear speech works best. Max {MAX_MB} MB.</p>
            <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            {recording ? (
              <Button variant="danger" onClick={stopRecording}>
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-400" /> Stop recording
              </Button>
            ) : (
              <Button variant="ghost" onClick={startRecording}>
                <Icon name="mic" className="h-4 w-4" /> Record with microphone
              </Button>
            )}
            {file && !recording && (
              <button type="button" onClick={() => setFile(null)} className="text-xs text-slate-400 underline hover:text-slate-200">
                Remove sample
              </button>
            )}
          </div>
        </div>

        <Field label="Preview sentence (optional)" hint="We will speak this in the new voice right after cloning.">
          <input className={inputClass} value={previewText} onChange={(e) => setPreviewText(e.target.value)} maxLength={300} />
        </Field>

        <p className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Pls Put Name in Voice name field. Only clone voices you own or have clear permission to use.
        </p>

        <Button onClick={submit} loading={loading} disabled={!canSubmit}>
          <Icon name="mic" className="h-4 w-4" /> {loading ? 'Cloning...' : 'Clone voice'}
        </Button>
      </Card>

      <div className="lg:col-span-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Result</h2>
          {done ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm text-emerald-300">
                <Icon name="check" className="h-4 w-4" /> <strong>{done.voice.name}</strong> was added to your voices.
              </p>
              {done.preview && <AudioCard entry={done.preview} />}
            </div>
          ) : (
            <div className="grid place-items-center rounded-xl border border-dashed border-white/10 py-14 text-center text-sm text-slate-400">
              <Icon name="mic" className="mb-3 h-8 w-8 text-slate-500" />
              Your cloned voice will show up here.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
