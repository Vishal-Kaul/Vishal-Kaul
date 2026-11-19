import { describe, it, expect } from 'vitest';
import { GREETING, INITIAL_QUICK_REPLIES, initialState, reducer } from './conversation';
import type { ConvAction, ConvState } from './types';
import { MAX_INPUT } from './types';

function run(actions: ConvAction[], start: ConvState = initialState()): ConvState {
  return actions.reduce(reducer, start);
}

describe('initialState', () => {
  it('starts idle with the greeting, chips and the welcome stage', () => {
    const s = initialState();
    expect(s.status).toBe('idle');
    expect(s.messages).toEqual([{ id: 'm1', role: 'assistant', text: GREETING }]);
    expect(s.quickReplies).toEqual(['I’m hiring', 'Just curious', 'Show me his work']);
    expect(s.quickReplies).toEqual(INITIAL_QUICK_REPLIES);
    expect(s.stage).toEqual({ view: 'welcome' });
    expect(s.seq).toBe(1);
    expect(s.showSeq).toBe(0);
    expect(s.error).toBeUndefined();
    expect(s.streamingId).toBeUndefined();
  });

  it('uses the exact greeting copy with typographic apostrophes and says it is an AI', () => {
    expect(GREETING).toBe(
      'Hi! I’m Vishal’s AI assistant. I can tell you about his work, check when he’s free for a call, or take a message. What brings you here?',
    );
    expect(GREETING).not.toContain("'");
  });

  it('returns a fresh object each call (no shared mutable state)', () => {
    const a = initialState();
    const b = initialState();
    expect(a).not.toBe(b);
    expect(a.messages).not.toBe(b.messages);
    expect(a.quickReplies).not.toBe(INITIAL_QUICK_REPLIES);
  });
});

describe('SEND', () => {
  it('appends a trimmed user message, clears chips and error, goes to thinking', () => {
    const s = reducer(initialState(), { type: 'SEND', text: '  hello there \n' });
    expect(s.messages).toHaveLength(2);
    expect(s.messages[1]).toEqual({ id: 'm2', role: 'user', text: 'hello there' });
    expect(s.seq).toBe(2);
    expect(s.quickReplies).toEqual([]);
    expect(s.status).toBe('thinking');
    expect(s.streamingId).toBeUndefined();
    expect(s.error).toBeUndefined();
  });

  it('ignores empty and whitespace-only text (same state object)', () => {
    const same = initialState();
    expect(reducer(same, { type: 'SEND', text: '' })).toBe(same);
    expect(reducer(same, { type: 'SEND', text: '   \n\t ' })).toBe(same);
  });

  it('is a no-op while thinking or streaming', () => {
    const thinking = reducer(initialState(), { type: 'SEND', text: 'one' });
    expect(reducer(thinking, { type: 'SEND', text: 'two' })).toBe(thinking);
    const streaming = reducer(thinking, { type: 'TOKEN', text: 'Hi ' });
    expect(streaming.status).toBe('streaming');
    expect(reducer(streaming, { type: 'SEND', text: 'two' })).toBe(streaming);
  });

  it('truncates input to MAX_INPUT characters', () => {
    const long = 'a'.repeat(MAX_INPUT + 250);
    const s = reducer(initialState(), { type: 'SEND', text: long });
    expect(s.messages[1].text).toHaveLength(MAX_INPUT);
    expect(MAX_INPUT).toBe(1000);
    const exact = reducer(initialState(), { type: 'SEND', text: 'b'.repeat(MAX_INPUT) });
    expect(exact.messages[1].text).toHaveLength(MAX_INPUT);
  });

  it('is allowed from error, clears the error and keeps earlier messages (including partial ones) untouched', () => {
    const errored = run([
      { type: 'SEND', text: 'one' },
      { type: 'TOKEN', text: 'Half ' },
      { type: 'FAIL', error: 'boom' },
    ]);
    const s = reducer(errored, { type: 'SEND', text: 'two' });
    expect(s.status).toBe('thinking');
    expect(s.error).toBeUndefined();
    expect(s.messages.slice(0, 3)).toEqual(errored.messages);
    expect(s.messages[2]).toEqual({ id: 'm3', role: 'assistant', text: 'Half ', partial: true });
    expect(s.messages[3]).toEqual({ id: 'm4', role: 'user', text: 'two' });
  });

  it('does not mutate the previous state', () => {
    const prev = initialState();
    const snapshot = JSON.parse(JSON.stringify(prev));
    reducer(prev, { type: 'SEND', text: 'hi' });
    expect(prev).toEqual(snapshot);
  });
});

describe('TOKEN', () => {
  it('first token creates an assistant bubble and sets streamingId; later tokens append', () => {
    const s1 = run([{ type: 'SEND', text: 'q' }, { type: 'TOKEN', text: 'Hello ' }]);
    expect(s1.status).toBe('streaming');
    expect(s1.streamingId).toBe('m3');
    expect(s1.messages[2]).toEqual({ id: 'm3', role: 'assistant', text: 'Hello ' });
    const s2 = reducer(s1, { type: 'TOKEN', text: 'world.' });
    expect(s2.messages).toHaveLength(3);
    expect(s2.messages[2].text).toBe('Hello world.');
    expect(s2.seq).toBe(3);
  });

  it('ignores stray tokens when idle or in error (same state object)', () => {
    const idle = initialState();
    expect(reducer(idle, { type: 'TOKEN', text: 'x' })).toBe(idle);
    const done = run([{ type: 'SEND', text: 'q' }, { type: 'TOKEN', text: 'a' }, { type: 'DONE' }]);
    expect(reducer(done, { type: 'TOKEN', text: 'x' })).toBe(done);
    const err = run([{ type: 'SEND', text: 'q' }, { type: 'FAIL', error: 'e' }]);
    expect(reducer(err, { type: 'TOKEN', text: 'x' })).toBe(err);
  });

  it('starts a new bubble if streamingId points at a missing message', () => {
    const s = run([{ type: 'SEND', text: 'q' }]);
    const weird: ConvState = { ...s, streamingId: 'm99' };
    const next = reducer(weird, { type: 'TOKEN', text: 'Hi' });
    expect(next.messages).toHaveLength(3);
    expect(next.streamingId).toBe('m3');
    expect(next.messages[2].text).toBe('Hi');
  });
});

describe('MESSAGE_BREAK', () => {
  it('clears streamingId so the next token starts a new bubble', () => {
    const s = run([
      { type: 'SEND', text: 'q' },
      { type: 'TOKEN', text: 'One.' },
      { type: 'MESSAGE_BREAK' },
      { type: 'TOKEN', text: 'Two.' },
    ]);
    expect(s.messages.map((m) => [m.id, m.role, m.text])).toEqual([
      ['m1', 'assistant', GREETING],
      ['m2', 'user', 'q'],
      ['m3', 'assistant', 'One.'],
      ['m4', 'assistant', 'Two.'],
    ]);
  });
});

describe('SHOW_PROJECT', () => {
  it('switches the stage to the project default tab and adds an activity line', () => {
    const s = run([{ type: 'SEND', text: 'q' }, { type: 'SHOW_PROJECT', project: 'fisdom' }]);
    expect(s.stage).toEqual({ view: 'project', project: 'fisdom', tab: 'overview' });
    expect(s.messages[2]).toEqual({ id: 'm3', role: 'activity', text: 'Pulling up the Fisdom Revamp case study' });
    expect(s.seq).toBe(3);
  });

  it('uses the given tab', () => {
    const s = run([{ type: 'SEND', text: 'q' }, { type: 'SHOW_PROJECT', project: 'turbo-mode', tab: 'gap' }]);
    expect(s.stage).toEqual({ view: 'project', project: 'turbo-mode', tab: 'gap' });
  });

  it('breaks the bubble: a TOKEN after SHOW_PROJECT goes in a new bubble below the activity pill', () => {
    const s = run([
      { type: 'SEND', text: 'turbo' },
      { type: 'TOKEN', text: 'Happy to! ' },
      { type: 'SHOW_PROJECT', project: 'turbo-mode', tab: 'results' },
      { type: 'TOKEN', text: 'Want the numbers?' },
      { type: 'QUICK_REPLIES', items: ['The numbers'] },
      { type: 'DONE' },
    ]);
    expect(s.messages.map((m) => [m.id, m.role, m.text])).toEqual([
      ['m1', 'assistant', GREETING],
      ['m2', 'user', 'turbo'],
      ['m3', 'assistant', 'Happy to! '],
      ['m4', 'activity', 'Pulling up the Turbo Mode case study'],
      ['m5', 'assistant', 'Want the numbers?'],
    ]);
    expect(s.quickReplies).toEqual(['The numbers']);
    expect(s.status).toBe('idle');
  });

  it('does not duplicate the activity line when the same project is already shown; only updates the tab', () => {
    const shown = run([
      { type: 'SEND', text: 'q' },
      { type: 'SHOW_PROJECT', project: 'turbo-mode', tab: 'results' },
    ]);
    const again = reducer(shown, { type: 'SHOW_PROJECT', project: 'turbo-mode', tab: 'gap' });
    expect(again.messages).toHaveLength(shown.messages.length);
    expect(again.stage).toEqual({ view: 'project', project: 'turbo-mode', tab: 'gap' });
    expect(again.seq).toBe(shown.seq);
    const noTab = reducer(again, { type: 'SHOW_PROJECT', project: 'turbo-mode' });
    expect(noTab.stage).toEqual({ view: 'project', project: 'turbo-mode', tab: 'gap' });
    expect(noTab.messages).toHaveLength(shown.messages.length);
  });

  it('same project again still ends the current bubble: the next token starts a new bubble', () => {
    const s = run([
      { type: 'SEND', text: 'turbo' },
      { type: 'SHOW_PROJECT', project: 'turbo-mode', tab: 'results' },
      { type: 'DONE' },
      { type: 'SEND', text: 'turbo again' },
      { type: 'TOKEN', text: 'got it down to two.' },
      { type: 'SHOW_PROJECT', project: 'turbo-mode', tab: 'results' },
      { type: 'TOKEN', text: 'Want the numbers?' },
      { type: 'DONE' },
    ]);
    const after = s.messages.slice(s.messages.findIndex((m) => m.text === 'turbo again') + 1);
    expect(after.map((m) => [m.role, m.text])).toEqual([
      ['assistant', 'got it down to two.'],
      ['assistant', 'Want the numbers?'],
    ]);
    expect(s.messages.some((m) => m.text.includes('two.Want'))).toBe(false);
  });

  it('showSeq counts every SHOW_PROJECT (same project included); tab switches and SHOW_WELCOME do not', () => {
    const s1 = run([{ type: 'SEND', text: 'q' }, { type: 'SHOW_PROJECT', project: 'turbo-mode' }]);
    expect(s1.showSeq).toBe(1);
    const s2 = reducer(s1, { type: 'SHOW_PROJECT', project: 'turbo-mode' });
    expect(s2.showSeq).toBe(2);
    const s3 = reducer(s2, { type: 'SHOW_PROJECT', project: 'turbo-mode', tab: 'gap' });
    expect(s3.showSeq).toBe(3);
    const s4 = reducer(s3, { type: 'SET_TAB', tab: 'learnings' });
    expect(s4.showSeq).toBe(3);
    expect(reducer(s4, { type: 'SHOW_WELCOME' }).showSeq).toBe(3);
    expect(reducer(s4, { type: 'SHOW_PROJECT', project: 'fisdom' }).showSeq).toBe(4);
  });

  it('adds a new activity line when switching to a different project', () => {
    const s = run([
      { type: 'SEND', text: 'q' },
      { type: 'SHOW_PROJECT', project: 'turbo-mode' },
      { type: 'SHOW_PROJECT', project: 'trade-ideas' },
    ]);
    expect(s.stage).toEqual({ view: 'project', project: 'trade-ideas', tab: 'overview' });
    expect(s.messages.filter((m) => m.role === 'activity').map((m) => m.text)).toEqual([
      'Pulling up the Turbo Mode case study',
      'Pulling up the Trade Ideas case study',
    ]);
  });
});

describe('QUICK_REPLIES', () => {
  it('sets the chips', () => {
    const s = reducer(initialState(), { type: 'QUICK_REPLIES', items: ['A', 'B'] });
    expect(s.quickReplies).toEqual(['A', 'B']);
  });
});

describe('DONE', () => {
  it('goes idle and clears streamingId', () => {
    const s = run([{ type: 'SEND', text: 'q' }, { type: 'TOKEN', text: 'x' }, { type: 'DONE' }]);
    expect(s.status).toBe('idle');
    expect(s.streamingId).toBeUndefined();
    expect(s.messages[2].partial).toBeUndefined();
  });
});

describe('FAIL', () => {
  it('goes to error, stores the error and marks the streaming bubble partial', () => {
    const s = run([{ type: 'SEND', text: 'q' }, { type: 'TOKEN', text: 'Half' }, { type: 'FAIL', error: 'Oops' }]);
    expect(s.status).toBe('error');
    expect(s.error).toBe('Oops');
    expect(s.streamingId).toBeUndefined();
    expect(s.messages[2]).toEqual({ id: 'm3', role: 'assistant', text: 'Half', partial: true });
  });

  it('marks nothing partial when no bubble was streaming', () => {
    const s = run([{ type: 'SEND', text: 'q' }, { type: 'FAIL', error: 'Oops' }]);
    expect(s.status).toBe('error');
    expect(s.messages.some((m) => m.partial)).toBe(false);
  });

  it('marks nothing partial after a MESSAGE_BREAK (earlier bubble was complete)', () => {
    const s = run([
      { type: 'SEND', text: 'q' },
      { type: 'TOKEN', text: 'Done.' },
      { type: 'MESSAGE_BREAK' },
      { type: 'FAIL', error: 'Oops' },
    ]);
    expect(s.messages.some((m) => m.partial)).toBe(false);
  });
});

describe('RETRY (regenerate)', () => {
  it('from error: drops the partial bubble, back to thinking, error cleared; the re-run starts a fresh bubble', () => {
    const err = run([{ type: 'SEND', text: 'q' }, { type: 'TOKEN', text: 'Half' }, { type: 'FAIL', error: 'Oops' }]);
    const s = reducer(err, { type: 'RETRY' });
    expect(s.status).toBe('thinking');
    expect(s.error).toBeUndefined();
    expect(s.streamingId).toBeUndefined();
    expect(s.messages.map((m) => [m.role, m.text])).toEqual([
      ['assistant', GREETING],
      ['user', 'q'],
    ]);
    const next = reducer(s, { type: 'TOKEN', text: 'Again' });
    expect(next.messages).toHaveLength(3);
    expect(next.messages[2]).toEqual({ id: 'm4', role: 'assistant', text: 'Again' });
  });

  it('drops every assistant bubble of the failed turn but keeps activity rows, the stage and earlier turns', () => {
    const err = run([
      { type: 'SEND', text: 'first' },
      { type: 'TOKEN', text: 'Earlier answer.' },
      { type: 'DONE' },
      { type: 'SEND', text: 'turbo' },
      { type: 'TOKEN', text: 'Happy to! ' },
      { type: 'SHOW_PROJECT', project: 'turbo-mode', tab: 'results' },
      { type: 'TOKEN', text: 'Want' },
      { type: 'FAIL', error: 'Oops' },
    ]);
    const s = reducer(err, { type: 'RETRY' });
    expect(s.messages.map((m) => [m.role, m.text])).toEqual([
      ['assistant', GREETING],
      ['user', 'first'],
      ['assistant', 'Earlier answer.'],
      ['user', 'turbo'],
      ['activity', 'Pulling up the Turbo Mode case study'],
    ]);
    expect(s.stage).toEqual({ view: 'project', project: 'turbo-mode', tab: 'results' });
  });

  it('from error with nothing streamed keeps the messages', () => {
    const err = run([{ type: 'SEND', text: 'q' }, { type: 'FAIL', error: 'Oops' }]);
    const s = reducer(err, { type: 'RETRY' });
    expect(s.status).toBe('thinking');
    expect(s.messages).toEqual(err.messages);
  });

  it('while thinking with nothing streamed: same state object', () => {
    const thinking = reducer(initialState(), { type: 'SEND', text: 'q' });
    expect(reducer(thinking, { type: 'RETRY' })).toBe(thinking);
  });

  it('while streaming: drops the in-flight bubble and goes back to thinking', () => {
    const streaming = run([{ type: 'SEND', text: 'q' }, { type: 'TOKEN', text: 'x' }]);
    const s = reducer(streaming, { type: 'RETRY' });
    expect(s.status).toBe('thinking');
    expect(s.streamingId).toBeUndefined();
    expect(s.messages.map((m) => m.role)).toEqual(['assistant', 'user']);
  });

  it('is a no-op when idle', () => {
    const idle = initialState();
    expect(reducer(idle, { type: 'RETRY' })).toBe(idle);
    const done = run([{ type: 'SEND', text: 'q' }, { type: 'TOKEN', text: 'x' }, { type: 'DONE' }]);
    expect(reducer(done, { type: 'RETRY' })).toBe(done);
  });
});

describe('SET_TAB and SHOW_WELCOME', () => {
  it('SET_TAB is a no-op on the welcome stage', () => {
    const s = initialState();
    expect(reducer(s, { type: 'SET_TAB', tab: 'gap' })).toBe(s);
  });

  it('SET_TAB changes the tab on a project stage', () => {
    const shown = run([{ type: 'SEND', text: 'q' }, { type: 'SHOW_PROJECT', project: 'turbo-mode' }]);
    const s = reducer(shown, { type: 'SET_TAB', tab: 'learnings' });
    expect(s.stage).toEqual({ view: 'project', project: 'turbo-mode', tab: 'learnings' });
    expect(s.messages).toBe(shown.messages);
  });

  it('SHOW_WELCOME returns to the welcome stage', () => {
    const shown = run([{ type: 'SEND', text: 'q' }, { type: 'SHOW_PROJECT', project: 'turbo-mode' }]);
    expect(reducer(shown, { type: 'SHOW_WELCOME' }).stage).toEqual({ view: 'welcome' });
  });

  it('after SHOW_WELCOME, showing the same project again adds a fresh activity line', () => {
    const s = run([
      { type: 'SEND', text: 'q' },
      { type: 'SHOW_PROJECT', project: 'turbo-mode' },
      { type: 'SHOW_WELCOME' },
      { type: 'SHOW_PROJECT', project: 'turbo-mode' },
    ]);
    expect(s.messages.filter((m) => m.role === 'activity')).toHaveLength(2);
  });
});

describe('determinism', () => {
  it('the same actions always produce the same ids and state', () => {
    const actions: ConvAction[] = [
      { type: 'SEND', text: 'turbo' },
      { type: 'TOKEN', text: 'a' },
      { type: 'SHOW_PROJECT', project: 'turbo-mode' },
      { type: 'TOKEN', text: 'b' },
      { type: 'DONE' },
      { type: 'SEND', text: 'again' },
      { type: 'TOKEN', text: 'c' },
      { type: 'DONE' },
    ];
    const a = run(actions);
    const b = run(actions);
    expect(a).toEqual(b);
    expect(a.messages.map((m) => m.id)).toEqual(['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7']);
    expect(new Set(a.messages.map((m) => m.id)).size).toBe(a.messages.length);
  });
});
