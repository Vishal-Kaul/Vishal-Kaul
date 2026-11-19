import { PROJECTS } from './projects';
import { MAX_INPUT, type ConvAction, type ConvState, type Message } from './types';

// The first message always says it is an AI (product rule).
export const GREETING =
  'Hi! I’m Vishal’s AI assistant. I can tell you about his work, check when he’s free for a call, or take a message. What brings you here?';

export const INITIAL_QUICK_REPLIES: readonly string[] = ['I’m hiring', 'Just curious', 'Show me his work'];

export function initialState(): ConvState {
  return {
    status: 'idle',
    messages: [{ id: 'm1', role: 'assistant', text: GREETING }],
    quickReplies: [...INITIAL_QUICK_REPLIES],
    stage: { view: 'welcome' },
    seq: 1,
    showSeq: 0,
  };
}

/** Pure: appends a message with the next deterministic id. */
function append(s: ConvState, role: Message['role'], text: string): { state: ConvState; id: string } {
  const seq = s.seq + 1;
  const id = `m${seq}`;
  return { state: { ...s, seq, messages: [...s.messages, { id, role, text }] }, id };
}

export function reducer(s: ConvState, a: ConvAction): ConvState {
  switch (a.type) {
    case 'SEND': {
      if (s.status === 'thinking' || s.status === 'streaming') return s;
      const text = a.text.trim().slice(0, MAX_INPUT);
      if (!text) return s;
      const { state } = append(s, 'user', text);
      return { ...state, quickReplies: [], error: undefined, status: 'thinking', streamingId: undefined };
    }

    case 'TOKEN': {
      if (s.status !== 'thinking' && s.status !== 'streaming') return s;
      if (!a.text) return s;
      const idx = s.streamingId ? s.messages.findIndex((m) => m.id === s.streamingId) : -1;
      if (idx >= 0) {
        const messages = s.messages.slice();
        messages[idx] = { ...messages[idx], text: messages[idx].text + a.text };
        return { ...s, messages, status: 'streaming' };
      }
      const { state, id } = append(s, 'assistant', a.text);
      return { ...state, streamingId: id, status: 'streaming' };
    }

    case 'MESSAGE_BREAK':
      return s.streamingId === undefined ? s : { ...s, streamingId: undefined };

    case 'SHOW_PROJECT': {
      const project = PROJECTS[a.project];
      const showSeq = s.showSeq + 1;
      if (s.stage.view === 'project' && s.stage.project === a.project) {
        // Already on stage: no new activity row, but the reply still breaks
        // here, so text after it starts a new bubble (never "two.Want").
        return { ...s, showSeq, streamingId: undefined, stage: a.tab ? { ...s.stage, tab: a.tab } : s.stage };
      }
      const { state } = append(s, 'activity', `Pulling up the ${project.name} case study`);
      return {
        ...state,
        showSeq,
        stage: { view: 'project', project: a.project, tab: a.tab ?? project.defaultTab },
        streamingId: undefined,
      };
    }

    case 'QUICK_REPLIES':
      return { ...s, quickReplies: [...a.items] };

    case 'DONE':
      return { ...s, status: 'idle', streamingId: undefined };

    case 'FAIL': {
      const messages = s.streamingId
        ? s.messages.map((m) => (m.id === s.streamingId ? { ...m, partial: true } : m))
        : s.messages;
      return { ...s, messages, status: 'error', error: a.error, streamingId: undefined };
    }

    case 'RETRY': {
      // Regenerate, not continue: the reply to the last visitor message is
      // discarded and streamed again from scratch. Continue from partial
      // arrives in step 2 with a real model.
      if (s.status === 'idle') return s;
      const lastUser = s.messages.findLastIndex((m) => m.role === 'user');
      const messages = s.messages.filter((m, i) => i <= lastUser || m.role !== 'assistant');
      const changed = messages.length !== s.messages.length;
      if (s.status === 'thinking' && !changed && s.streamingId === undefined) return s;
      return {
        ...s,
        messages: changed ? messages : s.messages,
        status: 'thinking',
        error: undefined,
        streamingId: undefined,
      };
    }

    case 'SET_TAB':
      if (s.stage.view !== 'project' || s.stage.tab === a.tab) return s;
      return { ...s, stage: { ...s.stage, tab: a.tab } };

    case 'SHOW_WELCOME':
      return s.stage.view === 'welcome' ? s : { ...s, stage: { view: 'welcome' } };

    default:
      return s;
  }
}
