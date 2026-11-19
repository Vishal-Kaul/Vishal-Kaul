'use client';

import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, Ref } from 'react';
import { MAX_INPUT } from '@/lib/types';
import { ArrowUpIcon, MicIcon } from './icons';

const MAX_HEIGHT = 110; // 5 lines at 22px

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
  variant: 'desktop' | 'mobile';
  inputRef?: Ref<HTMLTextAreaElement>;
};

export function Composer({ onSend, disabled, variant, inputRef }: Props) {
  const [draft, setDraft] = useState('');
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const noticeId = useId();
  const mobile = variant === 'mobile';
  const tooLong = draft.length > MAX_INPUT;
  const hasText = draft.trim().length > 0;

  const setRefs = useCallback(
    (el: HTMLTextAreaElement | null) => {
      localRef.current = el;
      if (typeof inputRef === 'function') inputRef(el);
      else if (inputRef) (inputRef as { current: HTMLTextAreaElement | null }).current = el;
    },
    [inputRef],
  );

  useLayoutEffect(() => {
    const el = localRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [draft]);

  function send() {
    const text = draft.trim().slice(0, MAX_INPUT);
    if (!text || disabled) return;
    onSend(text);
    setDraft('');
    localRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  const row = mobile
    ? 'flex items-end gap-2 rounded-full border border-line bg-white py-1.5 pl-5 pr-1.5 has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-brand'
    : 'flex items-end gap-3 pb-5 pl-6 pr-7 pt-4';

  return (
    <div className={mobile ? 'px-4 pb-3' : ''}>
      {tooLong && (
        <p id={noticeId} className={`text-[12px] text-muted ${mobile ? 'px-5 pb-1' : 'px-6'}`}>
          Messages are limited to 1,000 characters.
        </p>
      )}
      <div className={row}>
        <textarea
          ref={setRefs}
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={mobile ? 'Type, or tap the mic to talk' : 'Type a message, or tap the mic to talk'}
          aria-label="Message Vishal’s assistant"
          aria-describedby={tooLong ? noticeId : undefined}
          className={`min-w-0 flex-1 resize-none bg-transparent text-[15px] leading-[22px] text-ink placeholder:text-subtle ${
            mobile ? 'py-3 focus-visible:outline-none' : 'py-3 pl-[18px]'
          }`}
        />
        {hasText ? (
          <button
            type="button"
            aria-label="Send"
            onClick={send}
            className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-ink text-white"
          >
            <ArrowUpIcon />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Voice (coming soon)"
            aria-disabled="true"
            className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-ink text-white"
          >
            <MicIcon />
          </button>
        )}
      </div>
    </div>
  );
}
