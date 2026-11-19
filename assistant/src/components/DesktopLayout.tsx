'use client';

import type { ReactNode, RefObject } from 'react';
import type { Conversation } from '@/lib/types';
import { ChatCard } from './chat';
import { Nav } from './Nav';
import { Stage } from './stage';

export function DesktopLayout({
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
  return (
    <div className="bg-page">
      {!embed && <Nav onTalk={() => composerRef.current?.focus()} />}
      <main
        className={`grid min-h-[640px] grid-cols-[420px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-6 xl:grid-cols-[500px_minmax(0,1fr)] ${
          embed ? 'h-dvh p-6' : 'h-[calc(100dvh-76px)] px-10 pb-10'
        }`}
      >
        {children}
        <ChatCard conv={conv} variant="desktop" composerRef={composerRef} />
        <div className="h-full min-h-0 overflow-y-auto rounded-card">
          <Stage stage={conv.state.stage} variant="desktop" onTab={conv.setTab} onAsk={onAsk} />
        </div>
      </main>
    </div>
  );
}
