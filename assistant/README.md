# Vishal’s Assistant

An AI assistant for designer Vishal Kaul’s Framer portfolio. Visitors ask about his work, and the assistant pulls up case studies next to the chat.

**Status: step 1 of 6.** Screens and conversation flow with scripted replies. No real AI, no data saved yet.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Add `?embed=1` (http://localhost:3000/?embed=1) to see the layout used inside the Framer iframe: no top nav, full-height chat and stage.

## Tests

- `npm test` runs the unit and component tests (Vitest).
- `npm run e2e` builds the app, starts it on port 3100 and drives it in Chromium with Playwright. `playwright.config.ts` points at a pre-installed Chromium path (`/opt/pw-browsers/...`); on another machine, remove the `executablePath` launch option so Playwright uses its own browser (`npx playwright install chromium`).
- `e2e/screens.spec.ts` saves screenshots to `e2e/__screens__/` for review by eye. They are not assertions.

## Deploy to Vercel

1. Import the GitHub repository in Vercel.
2. Set **Root Directory** to `assistant`.
3. Framework preset: Next.js.
4. No environment variables are needed in step 1.

## Add to Framer

Option A: a page with the assistant.

1. Create a page at `/assistant`.
2. Add an Embed component with the URL `https://<your-vercel-domain>/?embed=1`.
3. Set width to Fill and height to 100vh (minimum 720).

Option B: a nav button. Add a button labelled “Talk to my assistant” to the site nav and link it to the `/assistant` page.

The `frame-ancestors` header in `next.config.ts` allows only `'self'` and `https://vishaluxi.framer.website`. If the site gets a custom domain, edit `next.config.ts` and add it, or the embed will be blocked. The Framer editor preview won’t render the embed; test on the published site.

“Open full case study” opens a new tab, so the Framer Embed must allow popups. Framer’s Embed allows them by default; if you use a custom sandbox, include `allow-popups` and `allow-popups-to-escape-sandbox`.

**Warning:** Don’t put step 1 on the public site: replies mention passing questions to Vishal, but messages aren’t sent until step 3.

## Project structure

- `src/lib`: conversation state and reducer, scripted replies (`mock-source.ts`), project content, and hooks (media query, reduced motion).
- `src/components/chat`: chat card, message list, composer, quick replies, activity pills.
- `src/components/stage`: welcome stage, case-study stage, tabs, funnel.
- `src/components/mobile`: the bottom sheet used for case studies on phones.
- `e2e`: Playwright tests.

Docs: [`../CLAUDE.md`](../CLAUDE.md) (build spec), [`../docs/spec/INTERACTION-SPEC.md`](../docs/spec/INTERACTION-SPEC.md), [`../docs/figma`](../docs/figma) (design screens).

## What’s next

2. Chat with streaming, the facts file, and tools that drive the stage.
3. Scheduling and message flow, saved to a database, with an emailed summary.
4. Inbox screen.
5. Voice mode.
6. Guardrail tests: 20 adversarial prompts (pay, phone number, commitments, made-up facts).

Waiting on: `assistant-facts.md`, Claude API key, database, email (Resend).
