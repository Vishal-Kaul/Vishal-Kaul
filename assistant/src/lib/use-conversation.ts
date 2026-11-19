'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { initialState, reducer } from './conversation';
import type { ConvAction, ConvState, Conversation, Message, ReplySource, SlowLevel, TabId } from './types';

export const STREAM_ERROR = 'Something went wrong on my side.';
export const SLOW_STILL_MS = 8000;
export const SLOW_LONG_MS = 20000;

function historyUpToLastUser(messages: Message[]): Message[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages.slice(0, i + 1);
  }
  return messages;
}

/**
 * Conversation core: owns the reducer, runs a ReplySource per visitor turn,
 * and reports when a reply is slow. Streams start only from send/retry
 * (never from effects), so StrictMode's double effects can't start a run twice.
 */
export function useConversation(source: ReplySource): Conversation {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  // Mirror of the reducer state that is current synchronously, so send/retry
  // see the effect of actions dispatched earlier in the same tick. Every
  // dispatch goes through `apply`, and the reducer is pure, so this always
  // equals what React will render.
  const stateRef = useRef<ConvState>(state);
  const sourceRef = useRef(source);
  const controllerRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const [runId, setRunId] = useState(0);
  const [slowMark, setSlowMark] = useState<{ runId: number; level: SlowLevel }>({ runId: 0, level: 'none' });

  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

  const apply = useCallback((action: ConvAction) => {
    stateRef.current = reducer(stateRef.current, action);
    dispatch(action);
  }, []);

  const startRun = useCallback(
    (history: Message[]) => {
      controllerRef.current?.abort();
      const id = ++runIdRef.current;
      const controller = new AbortController();
      controllerRef.current = controller;
      setRunId(id);
      const isStale = () => id !== runIdRef.current || controller.signal.aborted;

      void (async () => {
        try {
          for await (const ev of sourceRef.current.stream(history, controller.signal)) {
            if (isStale()) return;
            switch (ev.type) {
              case 'token':
                apply({ type: 'TOKEN', text: ev.text });
                break;
              case 'show_project':
                apply({ type: 'SHOW_PROJECT', project: ev.project, tab: ev.tab });
                break;
              case 'quick_replies':
                apply({ type: 'QUICK_REPLIES', items: ev.items });
                break;
              case 'break':
                apply({ type: 'MESSAGE_BREAK' });
                break;
            }
          }
          if (isStale()) return;
          apply({ type: 'DONE' });
        } catch {
          if (isStale()) return;
          apply({ type: 'FAIL', error: STREAM_ERROR });
        } finally {
          if (controllerRef.current === controller) controllerRef.current = null;
        }
      })();
    },
    [apply],
  );

  const send = useCallback(
    (text: string) => {
      const prev = stateRef.current;
      if (reducer(prev, { type: 'SEND', text }) === prev) return;
      apply({ type: 'SEND', text });
      startRun(stateRef.current.messages);
    },
    [apply, startRun],
  );

  const retry = useCallback(() => {
    const s = stateRef.current;
    if (s.status === 'error') {
      controllerRef.current?.abort();
      apply({ type: 'RETRY' });
    } else if (s.status === 'thinking' || s.status === 'streaming') {
      // "Try again" on a slow reply: drop the current run and start over.
      controllerRef.current?.abort();
      apply({ type: 'MESSAGE_BREAK' });
    } else {
      return;
    }
    startRun(historyUpToLastUser(stateRef.current.messages));
  }, [apply, startRun]);

  const setTab = useCallback((tab: TabId) => apply({ type: 'SET_TAB', tab }), [apply]);
  const showWelcome = useCallback(() => apply({ type: 'SHOW_WELCOME' }), [apply]);

  // Slow-reply timers: only while waiting for the first token of this run.
  useEffect(() => {
    if (state.status !== 'thinking') return;
    const still = setTimeout(() => setSlowMark({ runId, level: 'still' }), SLOW_STILL_MS);
    const long = setTimeout(() => setSlowMark({ runId, level: 'long' }), SLOW_LONG_MS);
    return () => {
      clearTimeout(still);
      clearTimeout(long);
    };
  }, [state.status, runId]);

  // Abort the in-flight run on unmount. (StrictMode's simulated unmount runs
  // before any send, so there is nothing to abort then.)
  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);

  const slow: SlowLevel = state.status === 'thinking' && slowMark.runId === runId ? slowMark.level : 'none';

  return { state, send, setTab, showWelcome, retry, slow };
}
