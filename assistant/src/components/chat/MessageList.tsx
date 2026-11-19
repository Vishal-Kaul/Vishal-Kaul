'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Conversation } from '@/lib/types';
import { ActivityPill } from './ActivityPill';
import { Bubble } from './Bubble';
import { DateDivider } from './DateDivider';
import { NewMessagePill } from './NewMessagePill';
import { Notices } from './Notices';
import { QuickReplies } from './QuickReplies';
import { TypingDots } from './TypingDots';

const NEAR_BOTTOM = 48;

type Props = {
  conv: Conversation;
  variant?: 'desktop' | 'mobile';
  /** rendered as the first child of the log (mobile hero) */
  leading?: ReactNode;
  /** rendered as the last child of the log (mobile: space under the case-study sheet) */
  trailing?: ReactNode;
  /** hide the "Today · HH:MM" divider */
  hideDate?: boolean;
  /** when set, the latest activity pill becomes a button that calls this */
  onActivityClick?: () => void;
  /** hide quick-reply chips (the visitor is typing) */
  hideQuickReplies?: boolean;
};

export function MessageList({ conv, variant = 'desktop', leading, trailing, hideDate, onActivityClick, hideQuickReplies }: Props) {
  const { messages, status, quickReplies } = conv.state;
  const ref = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const [showPill, setShowPill] = useState(false);
  const lastLen = messages.length ? messages[messages.length - 1].text.length : 0;
  const showChips = status === 'idle' && quickReplies.length > 0 && !hideQuickReplies;

  function scrollToBottom() {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
    atBottom.current = true;
    setShowPill(false);
  }

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM;
    if (atBottom.current) setShowPill(false);
  }

  const lastRole = messages.length ? messages[messages.length - 1].role : undefined;
  let lastActivityId: string | undefined;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'activity') {
      lastActivityId = messages[i].id;
      break;
    }
  }

  useEffect(() => {
    // The visitor's own message always scrolls into view.
    if (lastRole === 'user') atBottom.current = true;
    if (atBottom.current) {
      const el = ref.current;
      if (el) el.scrollTop = el.scrollHeight;
    } else {
      setShowPill(true);
    }
  }, [messages.length, lastLen, lastRole, status, quickReplies.length, conv.slow, hideQuickReplies]);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={ref}
        data-chat-scroll
        onScroll={onScroll}
        className={`flex h-full flex-col gap-4 overflow-y-auto ${variant === 'mobile' ? 'px-4 pb-4 pt-1' : 'px-6 py-6'}`}
      >
        <div
          role="log"
          aria-label="Conversation"
          aria-busy={status === 'streaming'}
          className="flex flex-col gap-4"
        >
        {leading}
        {!hideDate && <DateDivider />}
        {messages.map((m) =>
          m.role === 'activity' ? (
            <ActivityPill
              key={m.id}
              text={m.text}
              onClick={onActivityClick && m.id === lastActivityId ? onActivityClick : undefined}
            />
          ) : (
            <Bubble key={m.id} message={m} />
          ),
        )}
        {status === 'thinking' && <TypingDots />}
        </div>
        <Notices conv={conv} />
        {showChips && <QuickReplies items={quickReplies} onPick={(item) => conv.send(item)} />}
        {trailing}
      </div>
      {showPill && <NewMessagePill onClick={scrollToBottom} />}
    </div>
  );
}
