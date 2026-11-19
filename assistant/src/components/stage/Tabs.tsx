'use client';

import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { TAB_LABELS, TAB_ORDER } from '@/lib/projects';
import type { TabId } from '@/lib/types';

export function tabId(idPrefix: string, tab: TabId) {
  return `${idPrefix}-tab-${tab}`;
}

export function Tabs({
  value,
  onChange,
  idPrefix,
}: {
  value: TabId;
  onChange(tab: TabId): void;
  idPrefix: string;
}) {
  const refs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = -1;
    const n = TAB_ORDER.length;
    if (e.key === 'ArrowRight') next = (index + 1) % n;
    else if (e.key === 'ArrowLeft') next = (index - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    const t = TAB_ORDER[next];
    refs.current[t]?.focus();
    onChange(t);
  }

  return (
    <div
      role="tablist"
      aria-label="Case study sections"
      className="flex flex-nowrap gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {TAB_ORDER.map((t, i) => {
        const selected = t === value;
        return (
          <button
            key={t}
            ref={(el) => {
              refs.current[t] = el;
            }}
            id={tabId(idPrefix, t)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`h-11 shrink-0 rounded-full px-[18px] text-[15px] font-semibold ${
              selected ? 'bg-ink text-white' : 'border border-line bg-white text-ink'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        );
      })}
    </div>
  );
}
