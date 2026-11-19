'use client';

import type { Ref } from 'react';
import type { Conversation } from '@/lib/types';
import { ChatFooter } from './ChatFooter';
import { ChatHeader } from './ChatHeader';
import { Composer } from './Composer';
import { MessageList } from './MessageList';
import { StatusAnnouncer } from './StatusAnnouncer';

export function ChatCard({
  conv,
  variant,
  composerRef,
}: {
  conv: Conversation;
  variant: 'desktop' | 'mobile';
  composerRef?: Ref<HTMLTextAreaElement>;
}) {
  if (variant === 'mobile') {
    return (
      <div className="flex h-full flex-col bg-white pb-[max(12px,env(safe-area-inset-bottom))]">
        <MessageList conv={conv} />
        <Composer variant="mobile" onSend={conv.send} inputRef={composerRef} />
        <ChatFooter variant="mobile" />
        <StatusAnnouncer conv={conv} />
      </div>
    );
  }
  return (
    <section
      aria-label="Chat with Vishal’s AI assistant"
      className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card"
    >
      <ChatHeader />
      <MessageList conv={conv} />
      <Composer variant="desktop" onSend={conv.send} inputRef={composerRef} />
      <div className="pb-6">
        <ChatFooter variant="desktop" />
      </div>
      <StatusAnnouncer conv={conv} />
    </section>
  );
}
