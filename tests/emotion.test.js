import { describe, expect, it } from 'vitest';
import { parseSegments, usedEmotions } from '../server/emotion.js';

describe('parseSegments', () => {
  it('treats text without tags as neutral', () => {
    expect(parseSegments('Hello world')).toEqual([{ emotion: 'neutral', text: 'Hello world' }]);
  });

  it('splits text at emotion tags', () => {
    const segs = parseSegments('Hi [happy] great news [sad] but sorry');
    expect(segs).toEqual([
      { emotion: 'neutral', text: 'Hi' },
      { emotion: 'happy', text: 'great news' },
      { emotion: 'sad', text: 'but sorry' },
    ]);
  });

  it('is case-insensitive and keeps unknown tags as plain text', () => {
    const segs = parseSegments('[HAPPY] yay [unknown] still happy');
    expect(segs[0].emotion).toBe('happy');
    expect(segs[0].text).toContain('[unknown]');
  });

  it('returns nothing for empty or tag-only input', () => {
    expect(parseSegments('   ')).toEqual([]);
    expect(parseSegments('[happy]')).toEqual([]);
  });

  it('lists each used emotion once', () => {
    expect(usedEmotions(parseSegments('[happy] a [sad] b [happy] c'))).toEqual(['happy', 'sad']);
  });
});
