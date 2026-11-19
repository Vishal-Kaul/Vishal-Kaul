'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createMockSource } from '@/lib/mock-source';
import type { ReplySource } from '@/lib/types';
import { useConversation } from '@/lib/use-conversation';
import { useMediaQuery } from '@/lib/use-media-query';
import { DesktopLayout } from './DesktopLayout';
import { MobileLayout } from './MobileLayout';

export const DESKTOP_QUERY = '(min-width: 1024px)';

/**
 * The whole assistant page: owns the conversation and picks the desktop or
 * mobile layout. Before mount (server render and hydration) it renders only
 * an empty <main>, so there's no flash of the wrong layout.
 * `children` (the page's hidden heading) is placed inside <main>.
 */
export function AssistantApp({
  embed = false,
  source,
  children,
}: {
  embed?: boolean;
  /** for tests; defaults to the scripted mock source */
  source?: ReplySource;
  children?: ReactNode;
}) {
  const base = useMemo(() => source ?? createMockSource(), [source]);
  // Counts show_project events from the source, including ones that don't
  // change the stage (asking about the case study that's already up), so the
  // mobile sheet can reopen for them.
  const [showCount, setShowCount] = useState(0);
  const tapped = useMemo<ReplySource>(
    () => ({
      async *stream(history, signal) {
        for await (const ev of base.stream(history, signal)) {
          if (ev.type === 'show_project' && !signal.aborted) setShowCount((n) => n + 1);
          yield ev;
        }
      },
    }),
    [base],
  );
  const conv = useConversation(tapped);
  const { send } = conv;
  const onAsk = useCallback((name: string) => send(`Tell me about ${name}`), [send]);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  if (isDesktop === null) return <main className="min-h-dvh bg-page">{children}</main>;
  if (isDesktop) {
    return (
      <DesktopLayout conv={conv} embed={embed} composerRef={composerRef} onAsk={onAsk}>
        {children}
      </DesktopLayout>
    );
  }
  return (
    <MobileLayout conv={conv} embed={embed} composerRef={composerRef} onAsk={onAsk} showCount={showCount}>
      {children}
    </MobileLayout>
  );
}
