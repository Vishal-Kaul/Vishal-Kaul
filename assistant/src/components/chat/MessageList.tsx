'use client';

import { useEffect, useRef, useState } from 'react';
import type { Conversation } from '@/lib/types';
import { ActivityPill } from './ActivityPill';
import { Bubble } from './Bubble';
import { DateDivider } from './DateDivider';
import { NewMessagePill } from './NewMessagePill';
import { Notices } from './Notices';
import { QuickReplies } from './QuickReplies';
import { TypingDots } from './TypingDots';

const NEAR_BOTTOM = 48;

export function MessageList({ conv }: { conv: Conversation }) {
  const { messages, status, quickReplies } = conv.state;
  const ref = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const [showPill, setShowPill] = useState(false);
  const lastLen = messages.length ? messages[messages.length - 1].text.length : 0;
  const showChips = status === 'idle' && quickReplies.length > 0;

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

  useEffect(() => {
    // The visitor's own message always scrolls into view.
    if (lastRole === 'user') atBottom.current = true;
    if (atBottom.current) {
      const el = ref.current;
      if (el) el.scrollTop = el.scrollHeight;
    } else {
      setShowPill(true);
    }
  }, [messages.length, lastLen, lastRole, status, quickReplies.length, conv.slow]);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={ref}
        role="log"
        aria-label="Conversation"
        aria-busy={status === 'streaming'}
        onScroll={onScroll}
        className="flex h-full flex-col gap-4 overflow-y-auto px-6 py-6"
      >
        <DateDivider />
        {messages.map((m) =>
          m.role === 'activity' ? <ActivityPill key={m.id} text={m.text} /> : <Bubble key={m.id} message={m} />,
        )}
        {status === 'thinking' && <TypingDots />}
        <Notices conv={conv} />
        {showChips && <QuickReplies items={quickReplies} onPick={(item) => conv.send(item)} />}
      </div>
      {showPill && <NewMessagePill onClick={scrollToBottom} />}
    </div>
  );
}
