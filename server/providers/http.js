/**
 * HTTP provider for a third-party TTS API (set up for Fish Audio: POST https://api.fish.audio/v1/tts).
 * Configured via environment variables (see .env.example). If your API expects a different
 * request/response shape, adjust `buildTtsBody` and `readAudio` below; the rest of the app
 * does not need to change.
 */

// Our demo voice names. The real API does not know them, so they are not sent as a voice ID.
const BUILTIN_VOICES = new Set(['aria', 'leo', 'mira', 'kai']);

export function createHttpProvider(env = process.env) {
  const ttsUrl = env.TTS_API_URL;
  const cloneUrl = env.CLONE_API_URL;
  const authHeader = env.TTS_AUTH_HEADER || 'Authorization';
  const authPrefix = env.TTS_AUTH_PREFIX ?? 'Bearer ';
  const audioField = env.TTS_RESPONSE_AUDIO_FIELD || '';
  const voiceField = env.CLONE_RESPONSE_VOICE_FIELD || 'voice_id';
  const model = env.TTS_MODEL || 's2-pro';

  const headers = () =>
    env.TTS_API_KEY
      ? { [authHeader]: `${authPrefix}${env.TTS_API_KEY}` }
      : {};

  // Request body for Fish Audio.
  const buildTtsBody = ({ text, voice, speed }) => ({
    text,
    format: 'mp3',
    prosody: { speed },
    ...(voice && !BUILTIN_VOICES.has(voice)
      ? { reference_id: voice }
      : {}),
  });

  async function readAudio(res) {
    if (audioField) {
      const json = await res.json();
      const b64 = json[audioField];

      if (!b64) {
        throw new Error(`TTS response had no "${audioField}" field`);
      }

      return {
        audio: Buffer.from(b64, 'base64'),
        mime: 'audio/mpeg',
      };
    }

    const mime = res.headers.get('content-type') || 'audio/mpeg';

    return {
      audio: Buffer.from(await res.arrayBuffer()),
      mime: mime.split(';')[0],
    };
  }

  return {
    name: 'http',

    async synthesize(input) {
      if (!ttsUrl) {
        throw new Error('TTS_API_URL is not configured');
      }

      const res = await fetch(ttsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          model,
          ...headers(),
        },
        body: JSON.stringify(buildTtsBody(input)),
      });

      if (!res.ok) {
        throw new Error(
          `TTS API error ${res.status}: ${(await res.text()).slice(0, 200)}`
        );
      }

      return readAudio(res);
    },

    async cloneVoice({ name, sample }) {
      if (!cloneUrl) {
        throw new Error('CLONE_API_URL is not configured');
      }

      // Fish Audio "create model" (POST /model):
      // multipart form, "fast" mode is usable right away.
      const form = new FormData();

      form.append('type', 'tts');
      form.append('title', name);
      form.append('train_mode', 'fast');
      form.append('visibility', 'private');

      form.append(
        'voices',
        new Blob([sample.buffer], {
          type: sample.mimetype,
        }),
        sample.originalname || 'sample.wav'
      );

      const res = await fetch(cloneUrl, {
        method: 'POST',
        headers: headers(),
        body: form,
      });

      if (!res.ok) {
        throw new Error(
          `Clone API error ${res.status}: ${(await res.text()).slice(0, 200)}`
        );
      }

      const json = await res.json();

      if (json.state === 'failed') {
        throw new Error(
          'The provider could not create a voice from this sample'
        );
      }

      const voiceId =
        json._id ??
        json.id ??
        json[voiceField];

      if (!voiceId) {
        throw new Error('Clone response had no voice id');
      }

      return {
        voiceId: String(voiceId),
        name,
      };
    },
  };
}