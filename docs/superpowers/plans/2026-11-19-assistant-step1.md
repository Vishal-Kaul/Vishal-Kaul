# Assistant Step 1 (static screens + mocked replies) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Next.js app in `assistant/` that renders Figma screens 1, 2, 7 and 8 with a chat that streams mocked replies through the real conversation state machine and drives the stage.

**Architecture:** A pure TypeScript core (`lib/`) holds the conversation reducer, the `ReplySource` interface and a mock source; React components render chat and stage from that state. Step 2 replaces only the mock source with a streaming API route. Desktop shows chat card + stage side by side; below 768 px the page becomes full-screen chat with a hero card and a bottom-sheet stage.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4 (`@theme` tokens), `@fontsource/fira-sans` (self-hosted; Google Fonts is not reachable from the build sandbox), Vitest + Testing Library, Playwright (pre-installed Chromium) for e2e and screenshot checks.

**Spec:** `docs/superpowers/specs/2026-11-19-assistant-step1-design.md`, plus `CLAUDE.md` and `docs/spec/INTERACTION-SPEC.md`. Figma references: `docs/figma/*.png`.

## Global Constraints

- Colours: page `#FFFFFF`, wash `#F5F5F5`, ink `#1A1A1A`, muted `#6B6B6B`, subtle `#9A9A9A`, line `#E6E6E6`, brand `#127BB0`, brand tint `#E6F1F7`, stage `#1A1A1A`, positive `#2E7D5B`.
- Font: Fira Sans 400/500/600/700, letter-spacing `-0.01em` body, `-0.03em` headlines.
- Pills `rounded-full` for chips and buttons; cards `rounded-[24px]`; exactly one soft shadow, on the chat card.
- Motion: state cross-fade 180 ms ease-out, view changes 280 ms, stage cross-fade 200 ms, nothing over 400 ms. `prefers-reduced-motion` removes movement (opacity-only or none).
- Copy rules: first assistant message says it is an AI; footer "I'm an AI. I can't make commitments on Vishal's behalf." (desktop) / "I'm an AI. I can't make commitments for Vishal." (mobile). Mock replies never mention pay figures, a phone number or AlphaGrep, and use only numbers shown in Figma or CLAUDE.md.
- Input: Enter sends, Shift+Enter newline, whitespace-only ignored, max 1,000 characters with a visible notice.
- Accessibility: `aria-live="polite"` region announces state (Thinking, errors); real buttons; visible focus rings; touch targets ≥ 44 px; tabs follow the WAI-ARIA tabs pattern (arrow keys).
- Case-study tabs follow Figma (Overview, The gap, Results, Learnings), not the older list in CLAUDE.md.

## Review Focus

1. Visitor sends while a reply is still streaming — expected: input stays enabled, but the send is queued or blocked with no duplicated or interleaved bubbles. Test in Task 2 (`reducer ignores SEND while thinking/streaming`).
2. Visitor scrolls up during streaming — expected: no jump; a "New message" pill appears and scrolls down on click. Test in Task 4.
3. Unknown question to the mock — expected: honest "I don't have that yet, I can pass it to Vishal" reply, never an invented fact. Test in Task 2.
4. Page embedded in a Framer iframe at 360–1440 px — expected: no horizontal scroll, layout switches at 768 px. Test in Task 7 (Playwright at 390 and 1440).
5. Reduced motion on — expected: stage still switches and states still announce, without movement. Test in Task 5.

---

### Task 1: Scaffold app with tokens and test tooling

**Files:**
- Create: `assistant/` via `npx create-next-app@15 assistant --ts --tailwind --app --eslint --src-dir --import-alias "@/*" --use-npm --no-turbopack`
- Modify: `assistant/src/app/globals.css` (tokens in `@theme`: `--color-ink`, `--color-muted`, `--color-subtle`, `--color-line`, `--color-wash`, `--color-brand`, `--color-brand-tint`, `--color-stage`, `--color-positive`, `--font-sans`, `--shadow-card`, `--radius-card: 24px`; reduced-motion block)
- Modify: `assistant/src/app/layout.tsx` (import Fira Sans weights, `lang="en"`, metadata title "Vishal's Assistant")
- Create: `assistant/vitest.config.ts`, `assistant/vitest.setup.ts`, `assistant/playwright.config.ts`
- Test: `assistant/src/app/page.test.tsx`

- [ ] Step 1: Scaffold; install `@fontsource/fira-sans vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`; add scripts `test`, `e2e`.
- [ ] Step 2: Write `page.test.tsx`: renders home page, expects text "Vishal Kaul".
- [ ] Step 3: Run `npm test` → FAIL (default page). Replace page with minimal shell → PASS. `npm run build` passes.
- [ ] Step 4: Commit `feat(assistant): scaffold Next.js app with design tokens`.

### Task 2: Conversation core (reducer, ReplySource, mock source)

**Files:**
- Create: `assistant/src/lib/conversation.ts`, `assistant/src/lib/reply-source.ts`, `assistant/src/lib/mock-source.ts`, `assistant/src/lib/projects.ts`
- Test: `assistant/src/lib/conversation.test.ts`, `assistant/src/lib/mock-source.test.ts`

**Interfaces (produced):**
```ts
type ConvStatus = 'idle' | 'thinking' | 'streaming' | 'error';
type Message = { id: string; role: 'user' | 'assistant' | 'activity'; text: string; partial?: boolean };
type ProjectId = 'turbo-mode' | 'trade-ideas' | 'fisdom';
type ConvState = { status: ConvStatus; messages: Message[]; quickReplies: string[]; stage: { view: 'welcome' } | { view: 'project'; project: ProjectId; tab: TabId }; error?: string };
type ConvAction =
  | { type: 'SEND'; text: string }
  | { type: 'TOKEN'; text: string }
  | { type: 'SHOW_PROJECT'; project: ProjectId; tab?: TabId }
  | { type: 'QUICK_REPLIES'; items: string[] }
  | { type: 'MESSAGE_BREAK' }          // closes current assistant bubble, next TOKEN starts a new one
  | { type: 'DONE' } | { type: 'FAIL'; error: string } | { type: 'SET_TAB'; tab: TabId } | { type: 'SHOW_WELCOME' };
function initialState(): ConvState;   // one assistant greeting (must contain "AI assistant") + quick replies ["I'm hiring","Just curious","Show me his work"]
function reducer(s: ConvState, a: ConvAction): ConvState;
const MAX_INPUT = 1000;
type ReplyEvent = { type: 'token'; text: string } | { type: 'show_project'; project: ProjectId; tab?: TabId } | { type: 'quick_replies'; items: string[] } | { type: 'break' };
interface ReplySource { stream(history: Message[], signal: AbortSignal): AsyncIterable<ReplyEvent> }
function createMockSource(opts?: { tokenDelayMs?: number; firstTokenDelayMs?: number }): ReplySource;
// projects.ts
type TabId = 'overview' | 'gap' | 'results' | 'learnings';
type Project = { id: ProjectId; name: string; proof: { stat: string; label: string }; tabs: Record<TabId, ProjectTab>; caseStudyUrl: string; source: string };
const PROJECTS: Record<ProjectId, Project>;
```

- [ ] Step 1: Tests for reducer: SEND appends user message, trims text, clears quick replies, status→thinking; SEND with whitespace only is a no-op; SEND over 1000 chars truncates to 1000; SEND while thinking/streaming is a no-op; first TOKEN sets streaming and appends assistant bubble, later TOKENs append to it; MESSAGE_BREAK then TOKEN creates a second bubble; SHOW_PROJECT sets stage and inserts an activity message "Pulling up the {name} case study"; FAIL keeps partial text marked `partial: true`, status error; DONE→idle.
- [ ] Step 2: Tests for mock source (tokenDelayMs 0): "Tell me about Turbo Mode" yields show_project turbo-mode tab results, tokens joining to the Figma reply ("Happy to! Turbo Mode puts a whole options trade on one screen. Scalpers needed five screens and 10+ taps, so Vishal got it down to two."), break, "Want the numbers, or how he got there?", quick replies ["The numbers","How he got there","Other work"]; "salary"/"pay"/"ctc" → contains "That's one for Vishal himself" and no digits; "phone"/"number to call" → declines, offers message or call slot; "are you human" → contains "AI"; unrecognised text → contains "I don't have that" and "pass it to Vishal"; abort signal stops iteration.
- [ ] Step 3: Run `npm test` → FAIL. Implement. Mock matching is keyword-based (lowercased includes); tokens are words with trailing spaces; delays default first 600 ms, then 30 ms per token. `PROJECTS` content: Turbo Mode results tab = Figma screen 2 values exactly (10+ taps/five screens, 2 taps/one screen, funnel 8,352 · 6,117·73% · 4,849·79% · 3,683·76%, "8,352 traders · 3 months", takeaway, source line); Trade Ideas proof "4 prices / entry, stop loss, target and live, in one glance"; Fisdom proof "+32% / conversion after release". Tabs without Figma content get `placeholder: true` and copy "Details coming soon." `caseStudyUrl` = `https://vishaluxi.framer.website/` (exact project paths TBD by Vishal).
- [ ] Step 4: `npm test` → PASS. Commit `feat(assistant): conversation state machine and mock reply source`.

### Task 3: `useConversation` hook

**Files:** Create `assistant/src/lib/use-conversation.ts`; Test `assistant/src/lib/use-conversation.test.tsx`

**Interfaces:** `function useConversation(source: ReplySource): { state: ConvState; send(text: string): void; setTab(t: TabId): void; showWelcome(): void; retry(): void; slow: 'none' | 'still' | 'long' }`. Consumes Task 2.

- [ ] Step 1: Tests (fake timers, mock source with 0 delays): `send` drives SEND → tokens → DONE; a source that throws dispatches FAIL with message "Something went wrong on my side." and `retry` resends the last user text; `slow` becomes `'still'` after 8 s and `'long'` after 20 s with no token; unmount aborts the stream.
- [ ] Step 2: FAIL → implement → PASS. Commit `feat(assistant): useConversation hook`.

### Task 4: Chat card components

**Files:** Create in `assistant/src/components/chat/`: `ChatCard.tsx`, `ChatHeader.tsx` (Trust badge "AI assistant for Vishal" with positive dot; Voice pill — visual only in step 1, `aria-disabled` with title "Voice is coming soon"), `MessageList.tsx`, `Bubble.tsx`, `ActivityPill.tsx`, `TypingDots.tsx`, `QuickReplies.tsx`, `Composer.tsx` (placeholder "Type a message, or tap the mic to talk"; mobile "Type, or tap the mic to talk"), `NewMessagePill.tsx`, `ChatFooter.tsx`, `StatusAnnouncer.tsx`. Test `assistant/src/components/chat/ChatCard.test.tsx`.

**Interfaces:** `ChatCard({ conv: ReturnType<typeof useConversation>; variant: 'desktop' | 'mobile' })`.

- [ ] Step 1: Tests: greeting and "Today · HH:MM" divider render; clicking quick reply "Show me his work" sends it and hides chips; typing then Enter sends and keeps focus, Shift+Enter inserts newline; whitespace send does nothing; typing 1,001 chars shows notice "Messages are limited to 1,000 characters."; typing dots visible while `thinking`, gone at first token; announcer reads "Thinking" while thinking; error renders message + "Retry" + "Or leave a message for Vishal" link; when list is scrolled up (mock `scrollTop`) and a token arrives, "New message" pill appears.
- [ ] Step 2: FAIL → implement to match `docs/figma/01-welcome-desktop.png` and `02-case-study-desktop.png` (user bubble ink, assistant bubble white with line border, 24px radius card, header divider) → PASS. Commit `feat(assistant): chat card`.

### Task 5: Stage (welcome + case study)

**Files:** Create in `assistant/src/components/stage/`: `Stage.tsx` (cross-fade 200 ms between views keyed by view+project; reduced motion = instant), `WelcomeStage.tsx` (dark, blue radial glow top right, "Meet the assistant", headline, sub-copy, 3 proof tiles from `PROJECTS`, I can / I can't lists — copy exactly as Figma screen 1), `CaseStudyStage.tsx` (wash background; tabs; "{name} · case study"; headline with blue "2."; before/after cards; funnel bars; takeaway; source; "Open full case study ↗" opening `caseStudyUrl` in new tab with `rel="noopener"`), `Funnel.tsx`. Test `assistant/src/components/stage/Stage.test.tsx`.

**Interfaces:** `Stage({ stage: ConvState['stage']; onTab(t: TabId): void; onClose?(): void; variant: 'desktop' | 'sheet' })`. Proof tiles are buttons that call `send("Tell me about {name}")` via an `onAsk(name)` prop.

- [ ] Step 1: Tests: welcome shows "Ask me about Vishal's work." and three tiles; project view shows tablist with 4 tabs, Results selected; ArrowRight moves selection and calls `onTab`; "Open full case study" has `target="_blank"`; with `matchMedia('(prefers-reduced-motion: reduce)')` true the view swaps without transition classes.
- [ ] Step 2: FAIL → implement → PASS. Commit `feat(assistant): stage views`.

### Task 6: Page layouts (desktop + mobile sheet)

**Files:** Create `assistant/src/components/AssistantApp.tsx` (owns `useConversation(createMockSource())`), `assistant/src/components/Nav.tsx` (brand, Work/About/Resume links to the portfolio, "Talk to my assistant" pill focuses composer), `assistant/src/components/mobile/MobileHero.tsx`, `assistant/src/components/mobile/BottomSheet.tsx`; Modify `assistant/src/app/page.tsx`. Test `assistant/src/components/AssistantApp.test.tsx`.

**Interfaces:** `BottomSheet({ open: boolean; onClose(): void; children })` — pointer drag on handle: drag up past 80 px expands to full height, drag down past 120 px or velocity > 0.5 px/ms closes; Esc closes; focus moves into the sheet on open and back to composer on close; "Back to chat" button closes.

- [ ] Step 1: Tests: at desktop width, sending "Tell me about Turbo Mode" (0-delay mock) switches stage to case study; at mobile width (`matchMedia('(max-width: 767px)')`), hero card shows two proof stats (44% ordered in Turbo Mode, +32% Fisdom conversion) and the same message opens the bottom sheet; Esc and "Back to chat" close it; hero hides once the conversation has a user message.
- [ ] Step 2: FAIL → implement (CSS breakpoint `md:` = 768 px; mobile uses `100dvh` and `env(safe-area-inset-bottom)`) → PASS. Commit `feat(assistant): desktop and mobile layouts`.

### Task 7: E2E, visual check, embed readiness

**Files:** Create `assistant/e2e/assistant.spec.ts`; Modify `assistant/next.config.ts` (header `Content-Security-Policy: frame-ancestors 'self' https://*.framer.website https://*.framer.app https://framer.com`); Create `assistant/README.md` (run, test, deploy to Vercel, Framer Embed snippet).

- [ ] Step 1: Playwright tests against `npm run build && npm start`: at 1440×900 welcome matches structure (headline, 3 tiles, footer copy); full Turbo Mode flow reaches Results; at 390×844 no horizontal scroll (`scrollWidth <= innerWidth`), sheet opens and closes; screenshots saved to `assistant/e2e/__screens__/` at deviceScaleFactor 1 for side-by-side review with `docs/figma/`.
- [ ] Step 2: Run `npm run e2e -- --trace off` → PASS. Compare screenshots to Figma by eye; fix spacing gaps.
- [ ] Step 3: Commit `test(assistant): e2e flow, screenshots and framer embed headers`, push branch.
