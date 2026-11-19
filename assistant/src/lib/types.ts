// Shared contract for the conversation core, chat UI and stage.
// Do not change names or shapes without updating every consumer.

export type ProjectId = 'turbo-mode' | 'trade-ideas' | 'fisdom';
export type TabId = 'overview' | 'gap' | 'results' | 'learnings';

export type ConvStatus = 'idle' | 'thinking' | 'streaming' | 'error';

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'activity';
  text: string;
  /** true when a stream failed part-way through this assistant message */
  partial?: boolean;
};

export type StageState =
  | { view: 'welcome' }
  | { view: 'project'; project: ProjectId; tab: TabId };

export type ConvState = {
  status: ConvStatus;
  messages: Message[];
  quickReplies: string[];
  stage: StageState;
  error?: string;
  /** id of the assistant bubble currently receiving tokens; cleared by MESSAGE_BREAK, DONE, FAIL, RETRY and every SHOW_PROJECT */
  streamingId?: string;
  /**
   * Counts SHOW_PROJECT actions, including ones for the project already on
   * stage (which change nothing else). The mobile layout opens the case-study
   * sheet whenever it increases; tab switches never change it.
   */
  showSeq: number;
  /** monotonically increasing counter used to build deterministic message ids ("m1", "m2", ...) */
  seq: number;
};

export type ConvAction =
  | { type: 'SEND'; text: string }
  | { type: 'TOKEN'; text: string }
  | { type: 'SHOW_PROJECT'; project: ProjectId; tab?: TabId }
  | { type: 'QUICK_REPLIES'; items: string[] }
  | { type: 'MESSAGE_BREAK' }
  | { type: 'DONE' }
  | { type: 'FAIL'; error: string }
  | { type: 'SET_TAB'; tab: TabId }
  | { type: 'SHOW_WELCOME' }
  /**
   * Regenerate the reply to the last visitor message. From error, thinking or
   * streaming: removes the assistant bubbles after the last user message (the
   * failed or abandoned reply), clears the error, status -> 'thinking'.
   * Activity rows and the stage are kept. No-op when idle.
   * (Continuing from a partial reply arrives in step 2 with a real model.)
   */
  | { type: 'RETRY' };

export type ReplyEvent =
  | { type: 'token'; text: string }
  | { type: 'show_project'; project: ProjectId; tab?: TabId }
  | { type: 'quick_replies'; items: string[] }
  | { type: 'break' };

/** One turn of model-facing history: activity rows and partial replies are never included. */
export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export interface ReplySource {
  /** `history` ends with the visitor message being answered. */
  stream(history: ChatTurn[], signal: AbortSignal): AsyncIterable<ReplyEvent>;
}

export type SlowLevel = 'none' | 'still' | 'long';

/** What useConversation returns; chat UI and layouts consume this. */
export type Conversation = {
  state: ConvState;
  /** true if the message was accepted (a run started); false if ignored (empty after trimming, or a reply is in progress) */
  send(text: string): boolean;
  setTab(tab: TabId): void;
  showWelcome(): void;
  retry(): void;
  slow: SlowLevel;
};

export const MAX_INPUT = 1000;

// ---- Project content ----
export type FunnelRow = { label: string; shortLabel: string; value: string; fraction: number };

export type ProjectTab =
  | { placeholder: true }
  | {
      placeholder?: false;
      headline: string; // may contain one segment wrapped in [[ ]] that renders in brand blue
      subhead: string;
      before?: { kicker: string; shortKicker: string; value: string; caption: string; shortCaption: string };
      after?: { kicker: string; shortKicker: string; value: string; caption: string; shortCaption: string };
      funnel?: { title: string; shortTitle: string; meta: string; shortMeta: string; rows: FunnelRow[] };
      takeaway?: { text: string; shortText: string };
      source?: string;
    };

export type Project = {
  id: ProjectId;
  name: string;
  proof: { stat: string; label: string; mobileLabel: string };
  tabs: Record<TabId, ProjectTab>;
  defaultTab: TabId;
  caseStudyUrl: string;
};
