import type { ChatTurn, ProjectId, ReplyEvent, ReplySource, TabId } from './types';

// Scripted replies for the preview. A real streaming model replaces this
// source later; the rest of the app only sees ReplySource.
// Copy rules: typographic apostrophes, never echo the visitor, no phone
// numbers, no pay figures, never name a previous employer.

export type Step = { say: string } | { show: ProjectId; tab?: TabId };

export type RuleName =
  | 'injection'
  | 'abuse'
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
  | 'thanks'
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
    // Repeated abuse (escalate, end the chat) is handled from step 2 on.
    name: 'abuse',
    test: anyOf(
      /\bstupid\b/,
      /\bidiots?\b/,
      /\bdumb\b/,
      /\bshut up\b/,
      /\bf[u*]ck/,
      /\bshit/,
      /\buseless\b/,
      /\bhate you\b/,
    ),
    steps: [{ say: 'I’d like to keep this friendly. I’m happy to help with questions about Vishal’s work.' }],
    chips: ['Show me his work'],
  },
  {
    name: 'human',
    test: anyOf(
      /\bare you (a |an )?(human|real|real person|person|bot|robot|ai|vishal)\b/,
      /\bis this (a |an )?(human|real person|person|bot|robot|ai|vishal)\b/,
      /\bam i (talking|speaking|chatting) (to|with) (a |an )?(human|real person|person|bot|robot|ai|vishal)\b/,
      'real person',
    ),
    steps: [{ say: 'I’m an AI assistant, not Vishal. I can pass anything on to him, though.' }],
    chips: ['Show me his work', 'Leave a message'],
  },
  {
    name: 'pay',
    test: anyOf(
      /\bsalar(y|ies)\b/,
      /\bpay(s|ing)?\b/, // not "payment": "the payment flow" is a design question
      /\bpaid\b/,
      /\bctc\b/,
      /\bcompensation\b/,
      /\blpa\b/,
      /\bpackage\b/,
      // "rate" means pay unless it's a product metric ("conversion rate", "click rate"...)
      /(?<!\b(conversion|click|click-through|success|order|bounce|error|completion|retention|churn|drop-off|dropoff|open|response|adoption|growth|failure|fill|crash|engagement|frame|heart|interest|exchange)[\s-]+)\brates?\b/,
      'per hour',
      /\bhourly\b/,
      /\bcharg(e|es|ing)\b/,
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
    test: anyOf(/\bphone\b/, /\bwhatsapp\b/, 'mobile number', 'contact number', /\bhis number\b/, /\bcell\b/),
    steps: [{ say: 'I can’t share Vishal’s phone number, but I can take a message or suggest a time for a call.' }],
    chips: ['Leave a message', 'Find a time for a call'],
  },
  {
    // Requests to COMMIT Vishal to something (a date, a slot, joining) land
    // here. Questions ABOUT his availability or start ("When can he start?",
    // "Is he available immediately?") are facts and go to `hiring` below.
    name: 'commit',
    test: anyOf(
      /\bcommit/,
      /\bpromise/,
      /\bguarantee/,
      /\bwill he join\b/,
      /\bcan he (start|join) (on|by|from|next|this|tomorrow|in|monday|tuesday|wednesday|thursday|friday)\b/,
      /\bcan you confirm\b/,
      /\bconfirm (a |the )?(slot|date|time|interview|start|offer|meeting|call|that he|he)\b/,
    ),
    steps: [{ say: 'I can’t commit for Vishal, but I can note it and pass it on.' }],
    chips: ['Leave a message'],
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
    // After the other projects, so "numbers for Fisdom" goes to Fisdom; the
    // Turbo funnel is the only one with numbers to show.
    name: 'numbers',
    test: anyOf(/\bnumbers\b/),
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
    name: 'work',
    test: anyOf('his work', 'other work', 'projects', 'portfolio', 'case stud'),
    steps: [{ say: 'Here are three projects: Turbo Mode, Trade Ideas and the Fisdom revamp. Which one should I pull up?' }],
    chips: ['Turbo Mode', 'Trade Ideas', 'Fisdom Revamp'],
  },
  {
    // Hiring intent, and the facts he has shared about availability: open to
    // full-time, contract and freelance work; available immediately.
    name: 'hiring',
    test: anyOf(
      /\bhiring\b/,
      /\bhire[sd]?\b/,
      /\broles?\b/,
      /\bjobs?\b/,
      /\bpositions?\b/,
      /\bopenings?\b/,
      /\brecruit/,
      /\bfreelanc/,
      /\bcontract(s|or|ors|ing)?\b/,
      /\bfull[- ]?time\b/,
      /\bimmediately\b/,
      /\bwhen can he (start|join)\b/,
      /\bstart date\b/,
      /\bnotice period\b/,
    ),
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
    // Needs call context: bare "time", "times" or "free" ("his free time",
    // "how many times") are not about a call.
    name: 'call',
    test: anyOf(
      /\bcalls?\b/,
      /\b(chat|speak|talk) (with|to) him\b/,
      /\bmeet(s|ing|ings)?\b/,
      /\bschedul/,
      /\bslots?\b/,
      /\bavailable\b/, // "available immediately" is caught by `hiring` first
      /\bavailability\b/,
      /\bfree (for|to)\b/,
      /\bwhen is he free\b/,
      /\bwhat time\b/,
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
    name: 'thanks',
    test: anyOf(/\bthanks\b/, /\bthank you\b/, /\bcheers\b/, /\bty\b/, /\bthx\b/),
    steps: [{ say: 'You’re welcome! Anything else you’d like to know about Vishal’s work?' }],
    chips: ['Show me his work'],
  },
  {
    // A bare hello ("hi", "Hello Vishal", "hi there"): no question, 4 words at most.
    name: 'greeting',
    test: (t) => /^(hi|hello|hey|hii|hiya)\b/.test(t) && !t.includes('?') && t.split(/\s+/).length <= 4,
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

/**
 * Turns script steps into reply events. Two spoken steps in a row get a
 * `break` between them so they never run together in one bubble
 * (show_project already ends a bubble).
 */
export function stepsToEvents(steps: Step[], chips: string[]): ReplyEvent[] {
  const events: ReplyEvent[] = [];
  let lastSpoken = false;
  for (const step of steps) {
    if ('say' in step) {
      const tokens = tokenize(step.say);
      if (!tokens.length) continue;
      if (lastSpoken) events.push({ type: 'break' });
      for (const tok of tokens) events.push({ type: 'token', text: tok });
      lastSpoken = true;
    } else {
      events.push(step.tab ? { type: 'show_project', project: step.show, tab: step.tab } : { type: 'show_project', project: step.show });
      lastSpoken = false;
    }
  }
  if (chips.length) events.push({ type: 'quick_replies', items: [...chips] });
  return events;
}

export function pickReply(text: string): ScriptedReply {
  const t = normalise(text);
  const rule = RULES.find((r) => r.test(t)) ?? FALLBACK;
  return { rule: rule.name, events: stepsToEvents(rule.steps, rule.chips) };
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

function lastUserText(history: ChatTurn[]): string {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'user') return history[i].content;
  }
  return '';
}

export function createMockSource(opts: { tokenDelayMs?: number; firstTokenDelayMs?: number } = {}): ReplySource {
  const tokenDelayMs = opts.tokenDelayMs ?? 30;
  const firstTokenDelayMs = opts.firstTokenDelayMs ?? 600;
  return {
    async *stream(history: ChatTurn[], signal: AbortSignal): AsyncGenerator<ReplyEvent> {
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
