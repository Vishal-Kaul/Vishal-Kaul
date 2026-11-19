'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { PROJECTS } from '@/lib/projects';
import type { Conversation } from '@/lib/types';
import { ChatCard, TrustBadge } from './chat';
import { BottomSheet, SHEET_TOP, type CloseReason } from './mobile/BottomSheet';
import { MobileHero, Stage } from './stage';

export function MobileLayout({
  conv,
  embed,
  composerRef,
  onAsk,
  children,
}: {
  conv: Conversation;
  embed: boolean;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  onAsk: (name: string) => void;
  children?: ReactNode;
}) {
  const { stage, messages, showSeq } = conv.state;
  const [open, setOpen] = useState(false);
  const [seenShows, setSeenShows] = useState(showSeq);

  // Open the sheet whenever the assistant pulls up a case study (also when it
  // is the same one again: showSeq counts every show_project); tab switches
  // don't change it. Adjusting state during render avoids a frame with the
  // sheet still closed.
  if (showSeq !== seenShows) {
    setSeenShows(showSeq);
    if (showSeq > seenShows) setOpen(true);
  }

  // Focus goes back to the composer after an explicit close (Esc, "Back to
  // chat"), not after a swipe: focusing would pop the on-screen keyboard.
  // It's applied once the composer is no longer inert (see below).
  const focusOnClose = useRef(false);
  const closeSheet = useCallback((reason?: CloseReason) => {
    focusOnClose.current = reason !== 'swipe';
    setOpen(false);
  }, []);
  const closeFromStage = useCallback(() => closeSheet('button'), [closeSheet]);
  const openSheet = useCallback(() => setOpen(true), []);

  const hasVisitorMessage = messages.some((m) => m.role === 'user');
  const project = stage.view === 'project' ? PROJECTS[stage.project] : null;
  const sheetOpen = open && !!project;

  const mainRef = useRef<HTMLElement>(null);

  // Focus returns only after the composer stops being inert (same commit).
  useLayoutEffect(() => {
    if (!sheetOpen && focusOnClose.current) {
      focusOnClose.current = false;
      composerRef.current?.focus();
    }
  }, [sheetOpen, composerRef]);

  // While the sheet is open, pad the end of the chat log so its latest
  // messages (the visitor's question, "Pulling up…") sit just above the
  // sheet instead of behind it (Figma 08).
  const [inset, setInset] = useState(0);
  useLayoutEffect(() => {
    if (!sheetOpen) return;
    const log = mainRef.current?.querySelector<HTMLElement>('[data-chat-scroll]');
    if (!log) return;
    // last item bottom = log bottom - padding (16) - gap (16) - spacer; aim 10px above the sheet
    setInset(Math.max(0, Math.round(log.getBoundingClientRect().bottom - SHEET_TOP - 22)));
  }, [sheetOpen]);
  const spacer = sheetOpen && inset > 0 ? inset : 0;
  useLayoutEffect(() => {
    if (!spacer) return;
    const log = mainRef.current?.querySelector<HTMLElement>('[data-chat-scroll]');
    if (log) log.scrollTop = log.scrollHeight;
  }, [spacer, showSeq]);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[640px] flex-col overflow-hidden bg-page">
      <header className={`flex h-[60px] shrink-0 items-center px-5 ${embed ? 'justify-end' : 'justify-between'}`}>
        {!embed && <p className="text-[18px] font-bold tracking-[-0.02em] text-ink">Vishal Kaul</p>}
        <TrustBadge />
      </header>
      <main ref={mainRef} className="min-h-0 flex-1">
        {children}
        <ChatCard
          conv={conv}
          variant="mobile"
          composerRef={composerRef}
          hideDate
          leading={hasVisitorMessage ? undefined : <MobileHero />}
          trailing={spacer ? <div aria-hidden="true" className="shrink-0" style={{ height: spacer }} /> : undefined}
          onActivityClick={project ? openSheet : undefined}
          composerInert={sheetOpen}
        />
      </main>
      <BottomSheet open={sheetOpen} onClose={closeSheet} label={project ? `${project.name} case study` : 'Case study'}>
        {project && <Stage stage={stage} variant="sheet" onTab={conv.setTab} onAsk={onAsk} onClose={closeFromStage} />}
      </BottomSheet>
    </div>
  );
}
