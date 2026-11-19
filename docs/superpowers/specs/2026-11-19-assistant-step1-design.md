# Vishal's Assistant — Step 1 design (static screens with mocked replies)

## Intent
A public AI assistant for Vishal Kaul's Framer portfolio. Visitors ask about his work, see case-study detail on a "stage" beside the chat, request a call slot or leave a message. Full product rules live in `CLAUDE.md`; interaction, motion and edge cases in `docs/spec/INTERACTION-SPEC.md`.

Step 1 delivers screens 1, 2, 7 and 8 (Figma file `HzFN3pk9sdTa12G5pPetzm`, page "Assistant screens") as a working front end with mocked replies, so the look and feel can be reviewed before any backend exists.

## Decisions (made with Vishal)
- **Language:** English only.
- **Hosting:** the Framer site stays the site. The assistant is a separate Next.js app on Vercel, shown inside Framer through an Embed (an `/assistant` page and/or a floating button). Chosen because Framer can't hold secret keys or run server code.
- **Voice:** provider not chosen yet; decided at step 5.

## Approaches considered
- **A. Separate Next.js app embedded in Framer — chosen.** Testable, matches the spec's stack, backend lives with it. Layout is edited in code, not the Framer editor.
- **B. Framer code components + separate server.** Editable in Framer, but still needs outside hosting, and code components are harder to build and test.
- **C. Framer only.** Not possible: the API key would be public.

## Goals (step 1)
- Screens 1, 2 (desktop) and 7, 8 (mobile) matching Figma.
- Design tokens from CLAUDE.md (Fira Sans, colours, pill and 24px radii, one soft shadow) as Tailwind theme.
- Mocked assistant replies driven through the real conversation state machine (idle / thinking / speaking-as-streaming / error), so streaming, typing dots, quick replies and stage switching behave as in the interaction spec.
- Stage: welcome view (3 proof tiles, I can / I can't) and case-study view (tabs, headline, illustration, "Open full case study"), 200 ms cross-fade with an activity line ("Pulling up Turbo Mode").
- Mobile: full-screen chat, stage as a bottom sheet (drag to expand, swipe down to close).
- Accessibility from the start: aria-live state announcements, keyboard path through chat and tabs, focus rings, 44 px targets, reduced motion.
- Embeddable: works inside an iframe at any width.

## Non-goals (step 1)
Claude API, database, email, inbox, voice, scheduling flow, sound/haptics. These follow in steps 2–5.

## Anti-goals
- Mock replies must not state facts that aren't already in CLAUDE.md (no invented numbers).
- No AlphaGrep, no phone number, no pay talk, even in mocks.

## Builder's calls
- The app lives in `assistant/` so the repo's profile `README.md` stays untouched.
- Mock reply logic sits behind the same interface the real streaming API will use, so step 2 swaps the source, not the UI.
- Case-study content for step 1 uses only the facts in CLAUDE.md "Known data fixes" (Turbo Mode, Fisdom revamp); everything else is placeholder text clearly marked as such until `assistant-facts.md` arrives.
