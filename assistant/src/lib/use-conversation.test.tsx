import { describe, it, expect, vi, afterEach } from 'vitest';
import { StrictMode, type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { STREAM_ERROR, useConversation } from './use-conversation';
import { createMockSource } from './mock-source';
import { GREETING } from './conversation';
import type { ChatTurn, ReplyEvent, ReplySource } from './types';

const fast = () => createMockSource({ tokenDelayMs: 0, firstTokenDelayMs: 0 });

/** A source whose stream never yields; it resolves (ends silently) only when aborted. */
function hangingSource() {
  const signals: AbortSignal[] = [];
  const histories: ChatTurn[][] = [];
  const source: ReplySource = {
    async *stream(history, signal) {
      signals.push(signal);
      histories.push(history);
      await new Promise<void>((resolve) => {
        if (signal.aborted) return resolve();
        signal.addEventListener('abort', () => resolve(), { once: true });
      });
    },
  };
  return { source, signals, histories };
}

/** A source that throws on the first call, then delegates to the mock. */
function flakySource(failAfter: ReplyEvent[] = []) {
  let calls = 0;
  const histories: ChatTurn[][] = [];
  const mock = fast();
  const source: ReplySource = {
    async *stream(history, signal) {
      calls += 1;
      histories.push(history);
      if (calls === 1) {
        for (const ev of failAfter) {
          await Promise.resolve();
          yield ev;
        }
        throw new Error('network down');
      }
      yield* mock.stream(history, signal);
    },
  };
  return { source, histories, calls: () => calls };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useConversation', () => {
  it('starts from the initial state', () => {
    const { result } = renderHook(() => useConversation(fast()));
    expect(result.current.state.messages).toEqual([{ id: 'm1', role: 'assistant', text: GREETING }]);
    expect(result.current.state.status).toBe('idle');
    expect(result.current.slow).toBe('none');
  });

  it('runs the Turbo flow end to end: bubble, activity pill, bubble, chips, idle', async () => {
    const { result } = renderHook(() => useConversation(fast()));
    act(() => result.current.send('Turbo Mode'));
    expect(result.current.state.status).toBe('thinking');
    expect(result.current.state.messages[1]).toEqual({ id: 'm2', role: 'user', text: 'Turbo Mode' });
    await waitFor(() => expect(result.current.state.status).toBe('idle'));
    const s = result.current.state;
    expect(s.messages.map((m) => [m.id, m.role])).toEqual([
      ['m1', 'assistant'],
      ['m2', 'user'],
      ['m3', 'assistant'],
      ['m4', 'activity'],
      ['m5', 'assistant'],
    ]);
    expect(s.messages[2].text).toBe(
      'Happy to! Turbo Mode puts a whole options trade on one screen. Scalpers needed five screens and 10+ taps, so Vishal got it down to two.',
    );
    expect(s.messages[3].text).toBe('Pulling up the Turbo Mode case study');
    expect(s.messages[4].text).toBe('Want the numbers, or how he got there?');
    expect(s.quickReplies).toEqual(['The numbers', 'How he got there', 'Other work']);
    expect(s.stage).toEqual({ view: 'project', project: 'turbo-mode', tab: 'results' });
    expect(s.error).toBeUndefined();
  });

  it('passes history including the new user message to the source', async () => {
    const { source, histories } = hangingSource();
    const { result } = renderHook(() => useConversation(source));
    act(() => result.current.send('  hello  '));
    expect(histories).toHaveLength(1);
    expect(histories[0]).toEqual([
      { role: 'assistant', content: GREETING },
      { role: 'user', content: 'hello' },
    ]);
  });

  it('history drops activity rows and partial replies (send and retry alike)', async () => {
    const histories: ChatTurn[][] = [];
    let calls = 0;
    const source: ReplySource = {
      async *stream(history) {
        calls += 1;
        histories.push(history);
        if (calls === 1) {
          yield { type: 'token', text: 'Turbo intro. ' };
          yield { type: 'show_project', project: 'turbo-mode' };
          yield { type: 'token', text: 'Done.' };
          return;
        }
        if (calls === 2) {
          yield { type: 'token', text: 'Half ' };
          throw new Error('down');
        }
        yield { type: 'token', text: 'Whole.' };
      },
    };
    const { result } = renderHook(() => useConversation(source));
    act(() => void result.current.send('turbo'));
    await waitFor(() => expect(result.current.state.status).toBe('idle'));
    act(() => void result.current.send('more'));
    await waitFor(() => expect(result.current.state.status).toBe('error'));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.state.status).toBe('idle'));
    const expected: ChatTurn[] = [
      { role: 'assistant', content: GREETING },
      { role: 'user', content: 'turbo' },
      { role: 'assistant', content: 'Turbo intro. ' },
      { role: 'assistant', content: 'Done.' },
      { role: 'user', content: 'more' },
    ];
    expect(histories[1]).toEqual(expected);
    expect(histories[2]).toEqual(expected);
    for (const h of histories) {
      expect(h.every((t) => t.role === 'user' || t.role === 'assistant')).toBe(true);
      expect(h.some((t) => t.content.startsWith('Pulling up'))).toBe(false);
    }
  });

  it('send returns true when accepted, false when ignored (empty or busy)', () => {
    const { source } = hangingSource();
    const { result } = renderHook(() => useConversation(source));
    let r: boolean[] = [];
    act(() => {
      r = [result.current.send('   '), result.current.send('first'), result.current.send('second')];
    });
    expect(r).toEqual([false, true, false]);
  });

  it('a run that ends with no tokens fails (show_project and quick_replies alone do not count)', async () => {
    const source: ReplySource = {
      async *stream() {
        yield { type: 'show_project', project: 'fisdom' };
        yield { type: 'quick_replies', items: ['A'] };
      },
    };
    const { result } = renderHook(() => useConversation(source));
    act(() => void result.current.send('hi'));
    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.state.error).toBe(STREAM_ERROR);
  });

  it('a run that yields nothing at all fails', async () => {
    const source: ReplySource = {
      async *stream() {
        return;
      },
    };
    const { result } = renderHook(() => useConversation(source));
    act(() => void result.current.send('hi'));
    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.state.error).toBe(STREAM_ERROR);
  });

  it('retry regenerates: "Partial answer " then a throw, then retry leaves exactly one reply', async () => {
    let calls = 0;
    const source: ReplySource = {
      async *stream() {
        calls += 1;
        yield { type: 'token', text: 'Partial ' };
        yield { type: 'token', text: 'answer ' };
        if (calls === 1) throw new Error('down');
        yield { type: 'token', text: 'in full.' };
      },
    };
    const { result } = renderHook(() => useConversation(source));
    act(() => void result.current.send('question'));
    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.state.messages[2]).toMatchObject({ text: 'Partial answer ', partial: true });
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.state.status).toBe('idle'));
    const s = result.current.state;
    const afterUser = s.messages.slice(s.messages.findIndex((m) => m.role === 'user') + 1);
    expect(afterUser).toHaveLength(1);
    expect(afterUser[0]).toMatchObject({ role: 'assistant', text: 'Partial answer in full.' });
    expect(afterUser[0].partial).toBeUndefined();
  });

  it('asking about the project already on stage still splits the reply into two bubbles', async () => {
    const { result } = renderHook(() => useConversation(fast()));
    act(() => void result.current.send('Tell me about Turbo Mode'));
    await waitFor(() => expect(result.current.state.status).toBe('idle'));
    act(() => void result.current.send('Tell me about Turbo Mode'));
    await waitFor(() => expect(result.current.state.status).toBe('idle'));
    const s = result.current.state;
    const lastUser = s.messages.findLastIndex((m) => m.role === 'user');
    expect(s.messages.slice(lastUser + 1).map((m) => [m.role, m.text])).toEqual([
      [
        'assistant',
        'Happy to! Turbo Mode puts a whole options trade on one screen. Scalpers needed five screens and 10+ taps, so Vishal got it down to two.',
      ],
      ['assistant', 'Want the numbers, or how he got there?'],
    ]);
    expect(s.messages.some((m) => m.text.includes('two.Want'))).toBe(false);
    expect(s.showSeq).toBe(2);
  });

  it('ignores send while thinking, and empty sends', () => {
    const { source, histories } = hangingSource();
    const { result } = renderHook(() => useConversation(source));
    act(() => result.current.send('   '));
    expect(histories).toHaveLength(0);
    expect(result.current.state.messages).toHaveLength(1);
    act(() => result.current.send('first'));
    act(() => result.current.send('second'));
    expect(histories).toHaveLength(1);
    expect(result.current.state.messages.filter((m) => m.role === 'user').map((m) => m.text)).toEqual(['first']);
  });

  it('two sends in the same tick only start one run', () => {
    const { source, histories } = hangingSource();
    const { result } = renderHook(() => useConversation(source));
    act(() => {
      result.current.send('a');
      result.current.send('b');
    });
    expect(histories).toHaveLength(1);
    expect(result.current.state.messages.filter((m) => m.role === 'user')).toHaveLength(1);
  });

  it('a throwing source puts the conversation in error; retry completes without duplicating the user message', async () => {
    const flaky = flakySource([{ type: 'token', text: 'Half ' }]);
    const { result } = renderHook(() => useConversation(flaky.source));
    act(() => result.current.send('Show me his work'));
    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.state.error).toBe('Something went wrong on my side.');
    expect(result.current.state.messages[2]).toEqual({ id: 'm3', role: 'assistant', text: 'Half ', partial: true });

    act(() => result.current.retry());
    expect(result.current.state.status).toBe('thinking');
    expect(result.current.state.error).toBeUndefined();
    expect(result.current.state.messages.map((m) => m.role)).toEqual(['assistant', 'user']);
    await waitFor(() => expect(result.current.state.status).toBe('idle'));
    const s = result.current.state;
    expect(s.messages.filter((m) => m.role === 'user')).toHaveLength(1);
    expect(flaky.calls()).toBe(2);
    // retry history ends at the last user message (no partial bubble sent back)
    expect(flaky.histories[1].map((m) => m.role)).toEqual(['assistant', 'user']);
    // regenerate: the partial bubble is gone, one complete reply follows the question
    expect(s.messages.some((m) => m.partial)).toBe(false);
    expect(s.messages.filter((m) => m.text.includes('Half'))).toHaveLength(0);
    expect(s.messages[s.messages.length - 1].text).toBe(
      'Here are three projects: Turbo Mode, Trade Ideas and the Fisdom revamp. Which one should I pull up?',
    );
    expect(s.quickReplies).toEqual(['Turbo Mode', 'Trade Ideas', 'Fisdom Revamp']);
  });

  it('retry is a no-op when idle', () => {
    const { source, histories } = hangingSource();
    const { result } = renderHook(() => useConversation(source));
    const before = result.current.state;
    act(() => result.current.retry());
    expect(result.current.state).toBe(before);
    expect(histories).toHaveLength(0);
  });

  it('slow: "still" at 8 s, "long" at 20 s; retry while thinking aborts and restarts the run', async () => {
    vi.useFakeTimers();
    const { source, signals, histories } = hangingSource();
    const { result } = renderHook(() => useConversation(source));
    act(() => result.current.send('hello'));
    expect(result.current.slow).toBe('none');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(7999);
    });
    expect(result.current.slow).toBe('none');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(result.current.slow).toBe('still');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(12000);
    });
    expect(result.current.slow).toBe('long');

    act(() => result.current.retry());
    expect(signals[0].aborted).toBe(true);
    expect(signals).toHaveLength(2);
    expect(signals[1].aborted).toBe(false);
    expect(result.current.slow).toBe('none');
    expect(result.current.state.status).toBe('thinking');
    expect(result.current.state.messages.filter((m) => m.role === 'user')).toHaveLength(1);
    expect(histories[1].map((m) => m.content)).toEqual([GREETING, 'hello']);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000);
    });
    expect(result.current.slow).toBe('still');
  });

  it('slow resets to none on the first token', async () => {
    vi.useFakeTimers();
    const source = createMockSource({ firstTokenDelayMs: 9000, tokenDelayMs: 10 });
    const { result } = renderHook(() => useConversation(source));
    act(() => result.current.send('hi'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8500);
    });
    expect(result.current.slow).toBe('still');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(505);
    });
    expect(result.current.state.status).toBe('streaming');
    expect(result.current.slow).toBe('none');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });
    expect(result.current.state.status).toBe('idle');
    expect(result.current.slow).toBe('none');
  });

  it('aborts the in-flight run on unmount and ignores its later events', () => {
    const { source, signals } = hangingSource();
    const { result, unmount } = renderHook(() => useConversation(source));
    act(() => result.current.send('hello'));
    expect(signals[0].aborted).toBe(false);
    unmount();
    expect(signals[0].aborted).toBe(true);
  });

  it('works in StrictMode (one run per send, no duplicate messages)', async () => {
    const spy = vi.fn();
    const mock = fast();
    const source: ReplySource = {
      stream(history, signal) {
        spy();
        return mock.stream(history, signal);
      },
    };
    const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;
    const { result } = renderHook(() => useConversation(source), { wrapper });
    act(() => result.current.send('Turbo Mode'));
    await waitFor(() => expect(result.current.state.status).toBe('idle'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(result.current.state.messages.map((m) => m.id)).toEqual(['m1', 'm2', 'm3', 'm4', 'm5']);
  });

  it('setTab and showWelcome drive the stage', async () => {
    const { result } = renderHook(() => useConversation(fast()));
    act(() => result.current.setTab('gap'));
    expect(result.current.state.stage).toEqual({ view: 'welcome' });
    act(() => result.current.send('fisdom'));
    await waitFor(() => expect(result.current.state.status).toBe('idle'));
    act(() => result.current.setTab('learnings'));
    expect(result.current.state.stage).toEqual({ view: 'project', project: 'fisdom', tab: 'learnings' });
    act(() => result.current.showWelcome());
    expect(result.current.state.stage).toEqual({ view: 'welcome' });
  });

  it('a second conversation turn works after the first completes', async () => {
    const { result } = renderHook(() => useConversation(fast()));
    act(() => result.current.send('Turbo Mode'));
    await waitFor(() => expect(result.current.state.status).toBe('idle'));
    act(() => result.current.send('The numbers'));
    await waitFor(() => expect(result.current.state.status).toBe('idle'));
    const s = result.current.state;
    // same project already shown: no second activity pill
    expect(s.messages.filter((m) => m.role === 'activity')).toHaveLength(1);
    expect(s.messages[s.messages.length - 1].text).toBe(
      'Of the 8,352 traders who opened Turbo Mode, 44% placed an order. The full funnel is on the right.',
    );
    expect(s.quickReplies).toEqual(['How he got there', 'Other work']);
  });
});
