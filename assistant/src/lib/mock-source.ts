import type { Message, ProjectId, ReplyEvent, ReplySource, TabId } from './types';

// Scripted replies for the preview. A real streaming model replaces this
// source later; the rest of the app only sees ReplySource.
// Copy rules: typographic apostrophes, never echo the visitor, no phone
// numbers, no pay figures, never name a previous employer.

type Step = { say: string } | { show: ProjectId; tab?: TabId };

export type RuleName =
  | 'injection'
  | 'human'
  | 'pay'
  | 'phone'
  | 'commit'
  | 'numbers'
  | 'howGotThere'
  | 'turbo'
  | 'tradeIdeas'
  | 'fisdom'
  | 'work'
  | 'hiring'
  | 'curious'
  | 'call'
  | 'message'
  | 'greeting'
  | 'fallback';

/** A scripted reply: which rule matched and the events it produces. */
export type ScriptedReply = { rule: RuleName; events: ReplyEvent[] };

type Rule = { name: RuleName; test: (t: string) => boolean; steps: Step[]; chips: string[] };

const anyOf = (...needles: (string | RegExp)[]) => (t: string) =>
  needles.some((n) => (typeof n === 'string' ? t.includes(n) : n.test(t)));

const RULES: Rule[] = [
  {
    name: 'injection',
    test: anyOf(
      'ignore your',
      'ignore all',
      'ignore previous',
      'system prompt',
      'your instructions',
      'your prompt',
      'jailbreak',
      'developer mode',
    ),
    steps: [{ say: 'I can’t do that, but I’m happy to keep helping with questions about Vishal’s work.' }],
    chips: ['Show me his work'],
  },
  {
    name: 'human',
    test: anyOf(
      'are you human',
      'are you a human',
      'real person',
      'are you a bot',
      /\bare you ai\b/,
      /\bare you an ai\b/,
      'is this vishal',
      'am i talking to vishal',
    ),
    steps: [{ say: 'I’m an AI assistant, not Vishal. I can pass anything on to him, though.' }],
    chips: ['Show me his work', 'Leave a message'],
  },
  {
    name: 'pay',
    test: anyOf(
      /\bsalar(y|ies)\b/,
      /\bpay(s|ing|ment)?\b/,
      /\bpaid\b/,
      /\bctc\b/,
      /\bcompensation\b/,
      /\blpa\b/,
      /\bpackage\b/,
      /\brates?\b/,
      'per hour',
      /\bhourly\b/,
      /\bexpect(ed|ation|ations)?\s+(salary|ctc|pay|compensation|rate|package)\b/,
      /\bmoney\b/,
      /\bbudget\b/,
      /\b(job offer|an offer|offer letter|counter ?offer)\b/,
    ),
    steps: [{ say: 'That’s one for Vishal himself. I can pass the question on.' }],
    chips: ['Leave a message', 'Show me his work'],
  },
  {
    name: 'phone',
    test: anyOf(/\bphone\b/, /\bwhatsapp\b/, 'mobile number', 'contact number', 'his number', /\bcell\b/),
    steps: [{ say: 'I can’t share Vishal’s phone number, but I can take a message or suggest a time for a call.' }],
    chips: ['Leave a message', 'Find a time for a call'],
  },
  {
    name: 'commit',
    test: anyOf(/\bcommit/, /\bpromise/, /\bguarantee/, 'can he start', 'will he join', /\bconfirm/),
    steps: [{ say: 'I can’t commit for Vishal, but I can note it and pass it on.' }],
    chips: ['Leave a message'],
  },
  {
    name: 'numbers',
    test: anyOf('the numbers'),
    steps: [
      { show: 'turbo-mode', tab: 'results' },
      { say: 'Of the 8,352 traders who opened Turbo Mode, 44% placed an order. The full funnel is on the right.' },
    ],
    chips: ['How he got there', 'Other work'],
  },
  {
    name: 'howGotThere',
    test: anyOf('how he got there'),
    steps: [
      {
        say: 'I don’t have the full story of how he got there yet, so I won’t guess. I can pass the question to Vishal.',
      },
    ],
    chips: ['The numbers', 'Leave a message'],
  },
  {
    name: 'turbo',
    test: anyOf('turbo'),
    steps: [
      {
        say: 'Happy to! Turbo Mode puts a whole options trade on one screen. Scalpers needed five screens and 10+ taps, so Vishal got it down to two.',
      },
      { show: 'turbo-mode', tab: 'results' },
      { say: 'Want the numbers, or how he got there?' },
    ],
    chips: ['The numbers', 'How he got there', 'Other work'],
  },
  {
    name: 'tradeIdeas',
    test: anyOf('trade idea'),
    steps: [
      { show: 'trade-ideas' },
      {
        say: 'Trade Ideas shows four prices on one card: entry, stop loss, target and live, so a trader can read an idea in one glance. That’s all I have on it so far, but I can pass questions to Vishal.',
      },
    ],
    chips: ['Turbo Mode', 'Fisdom Revamp'],
  },
  {
    name: 'fisdom',
    test: anyOf('fisdom'),
    steps: [
      { show: 'fisdom' },
      {
        say: 'The Fisdom revamp lifted conversion by 32% after release. I don’t have the full write-up yet, but I can pass questions to Vishal.',
      },
    ],
    chips: ['Turbo Mode', 'Trade Ideas'],
  },
  {
    name: 'work',
    test: anyOf('his work', 'other work', 'projects', 'portfolio', 'case stud'),
    steps: [{ say: 'Here are three projects: Turbo Mode, Trade Ideas and the Fisdom revamp. Which one should I pull up?' }],
    chips: ['Turbo Mode', 'Trade Ideas', 'Fisdom Revamp'],
  },
  {
    name: 'hiring',
    test: anyOf(/\bhiring\b/, /\bhire[sd]?\b/, /\broles?\b/, /\bjobs?\b/, /\bpositions?\b/, /\bopenings?\b/, /\brecruit/),
    steps: [
      {
        say: 'Great! Vishal is open to full-time, contract and freelance work, and he’s available immediately. Want to see his work, or find a time for a call?',
      },
    ],
    chips: ['Show me his work', 'Find a time for a call', 'Leave a message'],
  },
  {
    name: 'curious',
    test: anyOf(/\bcurious\b/, 'just looking', /\bbrowsing\b/),
    steps: [{ say: 'Welcome! Vishal is a Senior Product Designer. Want me to pull up one of his projects?' }],
    chips: ['Turbo Mode', 'Show me his work'],
  },
  {
    name: 'call',
    test: anyOf(
      /\bcalls?\b/,
      /\bavailable\b/,
      /\bavailability\b/,
      /\bfree\b/,
      /\bschedul/,
      /\bmeet/,
      /\bslots?\b/,
      /\btimes?\b/,
    ),
    steps: [
      {
        say: 'Vishal takes calls Monday to Friday, 11 to 1 and 4 to 6 IST. Booking slots here is coming soon. Any time you pick stays tentative until Vishal confirms.',
      },
    ],
    chips: ['Leave a message', 'Show me his work'],
  },
  {
    name: 'message',
    test: anyOf(/\bmessage/, /\bcontact/, /\be-?mail/, /\breach\b/),
    steps: [{ say: 'Taking messages for Vishal is coming in the next version of this preview, so nothing is sent yet.' }],
    chips: ['Show me his work'],
  },
  {
    name: 'greeting',
    test: (t) => /^(hi|hello|hey|hii)[!.]?$/.test(t),
    steps: [{ say: 'Hi! What would you like to know about Vishal’s work?' }],
    chips: ['Show me his work', 'I’m hiring'],
  },
];

const FALLBACK: Rule = {
  name: 'fallback',
  test: () => true,
  steps: [
    {
      say: 'I don’t have that in what Vishal has shared with me, so I won’t guess. I can pass the question to him if you’d like.',
    },
  ],
  chips: ['Leave a message', 'Show me his work'],
};

/** Words with their trailing whitespace; joining the result gives back the input exactly. */
export function tokenize(text: string): string[] {
  return text.match(/\s*\S+\s*/g) ?? [];
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/[’‘]/g, "'").trim();
}

export function pickReply(text: string): ScriptedReply {
  const t = normalise(text);
  const rule = RULES.find((r) => r.test(t)) ?? FALLBACK;
  const events: ReplyEvent[] = [];
  for (const step of rule.steps) {
    if ('say' in step) {
      for (const tok of tokenize(step.say)) events.push({ type: 'token', text: tok });
    } else {
      events.push(step.tab ? { type: 'show_project', project: step.show, tab: step.tab } : { type: 'show_project', project: step.show });
    }
  }
  if (rule.chips.length) events.push({ type: 'quick_replies', items: [...rule.chips] });
  return { rule: rule.name, events };
}

/** Resolves after ms, or as soon as the signal aborts (timer cleared). ms <= 0 still yields control. */
function wait(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0 || signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    signal.addEventListener('abort', done, { once: true });
  });
}

function lastUserText(history: Message[]): string {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'user') return history[i].text;
  }
  return '';
}

export function createMockSource(opts: { tokenDelayMs?: number; firstTokenDelayMs?: number } = {}): ReplySource {
  const tokenDelayMs = opts.tokenDelayMs ?? 30;
  const firstTokenDelayMs = opts.firstTokenDelayMs ?? 600;
  return {
    async *stream(history: Message[], signal: AbortSignal): AsyncGenerator<ReplyEvent> {
      const { events } = pickReply(lastUserText(history));
      if (signal.aborted) return;
      await wait(firstTokenDelayMs, signal);
      for (let i = 0; i < events.length; i++) {
        if (signal.aborted) return;
        const ev = events[i];
        if (i > 0) {
          await wait(ev.type === 'token' ? tokenDelayMs : 0, signal);
          if (signal.aborted) return;
        }
        yield ev;
      }
    },
  };
}
