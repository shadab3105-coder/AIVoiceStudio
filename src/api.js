async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

const json = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const api = {
  health: () => request('/api/health'),
  voices: () => request('/api/voices').then((d) => d.voices),
  history: () => request('/api/history').then((d) => d.history),
  tts: (body) => request('/api/tts', json('POST', body)),
  clone: (formData) => request('/api/clone', { method: 'POST', body: formData }),
  deleteHistory: (id) => request(`/api/history/${id}`, { method: 'DELETE' }),
  deleteVoice: (id) => request(`/api/voices/${id}`, { method: 'DELETE' }),
};
