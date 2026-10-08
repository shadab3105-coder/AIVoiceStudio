export const EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'calm', 'excited', 'whisper'];

const TAG_RE = /\[([a-zA-Z]+)\]/g;

/**
 * Split text containing inline emotion tags into segments.
 * "Hello [happy] great news [sad] but..." ->
 *   [{emotion:'neutral', text:'Hello'}, {emotion:'happy', text:'great news'}, {emotion:'sad', text:'but...'}]
 * Unknown tags are kept as plain text.
 */
export function parseSegments(input) {
  const segments = [];
  let current = 'neutral';
  let last = 0;
  let match;
  const push = (text) => {
    const clean = text.trim();
    if (clean) segments.push({ emotion: current, text: clean });
  };
  TAG_RE.lastIndex = 0;
  while ((match = TAG_RE.exec(input)) !== null) {
    const tag = match[1].toLowerCase();
    if (!EMOTIONS.includes(tag)) continue;
    push(input.slice(last, match.index));
    current = tag;
    last = match.index + match[0].length;
  }
  push(input.slice(last));
  return segments;
}

export function usedEmotions(segments) {
  return [...new Set(segments.map((s) => s.emotion))];
}
