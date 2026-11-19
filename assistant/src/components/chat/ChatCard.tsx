'use client';

import { useState } from 'react';
import type { ReactNode, Ref } from 'react';
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
  leading,
  trailing,
  hideDate,
  onActivityClick,
  composerInert,
}: {
  conv: Conversation;
  variant: 'desktop' | 'mobile';
  composerRef?: Ref<HTMLTextAreaElement>;
  /** rendered first inside the message log (mobile hero) */
  leading?: ReactNode;
  /** rendered last inside the message log */
  trailing?: ReactNode;
  /** hide the "Today · HH:MM" divider */
  hideDate?: boolean;
  /** makes the latest activity pill a button (mobile: reopen the case-study sheet) */
  onActivityClick?: () => void;
  /** makes the composer and footer inert (mobile: while the case-study sheet covers them) */
  composerInert?: boolean;
}) {
  const [typing, setTyping] = useState(false);
  const busy = conv.state.status === 'thinking' || conv.state.status === 'streaming';
  const listProps = { conv, leading, trailing, hideDate, onActivityClick, hideQuickReplies: typing };
  const composerProps = { onSend: conv.send, inputRef: composerRef, disabled: busy, onDraftChange: setTyping };
  if (variant === 'mobile') {
    return (
      <div className="flex h-full flex-col bg-white pb-[max(12px,env(safe-area-inset-bottom))]">
        <MessageList {...listProps} variant="mobile" />
        <div inert={composerInert || undefined}>
          <Composer variant="mobile" {...composerProps} />
          <ChatFooter variant="mobile" />
        </div>
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
      <MessageList {...listProps} variant="desktop" />
      <Composer variant="desktop" {...composerProps} />
      <div className="pb-[19px]">
        <ChatFooter variant="desktop" />
      </div>
      <StatusAnnouncer conv={conv} />
    </section>
  );
}
