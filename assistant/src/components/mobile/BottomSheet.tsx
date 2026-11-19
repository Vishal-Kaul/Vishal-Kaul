'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';

/** Top edge of the sheet at its default height, in px from the viewport top (Figma 08). */
export const SHEET_TOP = 178;
const TOP_DEFAULT = `${SHEET_TOP}px`;
/** Top edge when expanded. */
const TOP_EXPANDED = 'max(12px, env(safe-area-inset-top))';
/** How far the default position sits below the expanded one. */
const DEFAULT_OFFSET = `calc(${TOP_DEFAULT} - ${TOP_EXPANDED})`;

const EXPAND_PX = 80; // drag up further than this: expand
const DISMISS_PX = 120; // drag down further than this: step down (expanded → default → closed)
const FLING_PX_PER_MS = 0.5; // or a downward fling faster than this
const FLING_MIN_PX = 24; // …that moved at least this far
const SLOP_PX = 6; // movement before a gesture counts as a drag
const VELOCITY_WINDOW_MS = 100;
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const DURATION = 280;

type Gesture = {
  id: number;
  startX: number;
  startY: number;
  dy: number;
  /** started on the handle or the tab row (else: in the scrolling content) */
  header: boolean;
  active: boolean;
  samples: { t: number; y: number }[];
};

/**
 * Non-modal bottom sheet for the mobile case study. Drag the handle or the
 * tab row (or the content, when it is scrolled to the top and the drag goes
 * down) to resize: up expands, down steps back to the default height and
 * then closes. When closed it stays mounted but is inert and hidden, so it
 * can slide in and out.
 */
export function BottomSheet({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [dragY, setDragY] = useState<number | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);
  const panelRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Every opening starts at the default height.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setExpanded(false);
      setDragY(null);
    }
  }

  // Focus the selected tab (or the heading) when the sheet opens.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    let target = panel.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!target) {
      target = panel.querySelector<HTMLElement>('h1, h2, h3');
      if (target && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    }
    (target ?? panel).focus({ preventScroll: true });
  }, [open]);

  // Esc closes while open (the sheet is non-modal, so listen on the document).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        e.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Once a drag has started inside the scrolling content, stop the browser
  // from scrolling (or overscrolling) it. Needs a non-passive listener.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (gesture.current?.active && e.cancelable) e.preventDefault();
    };
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, []);

  const toggle = useCallback(() => setExpanded((x) => !x), []);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    suppressClick.current = false;
    if (!open || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const target = e.target as Element;
    const header = !!handleRef.current?.contains(target) || !!target.closest('[role="tablist"]');
    // In the content, only touch/pen drags move the sheet (a mouse selects text).
    if (!header && e.pointerType === 'mouse') return;
    const now = performance.now();
    gesture.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      dy: 0,
      header,
      active: false,
      samples: [{ t: now, y: e.clientY }],
    };
    // Keep receiving moves once the pointer leaves the sheet. Capture on the
    // element itself (touch does this implicitly) so a plain tap still clicks it.
    if (header) {
      try {
        (e.target as Element).setPointerCapture?.(e.pointerId);
      } catch {
        // not capturable (pointer already gone)
      }
    }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dy = e.clientY - g.startY;
    const dx = e.clientX - g.startX;
    if (!g.active) {
      if (Math.abs(dy) < SLOP_PX && Math.abs(dx) < SLOP_PX) return;
      const horizontal = Math.abs(dx) > Math.abs(dy);
      const contentCanScroll = !g.header && (dy < 0 || (scrollRef.current?.scrollTop ?? 0) > 0);
      if (horizontal || contentCanScroll) {
        gesture.current = null; // let the tab row or the content scroll natively
        return;
      }
      g.active = true;
    }
    const t = performance.now();
    g.dy = dy;
    g.samples.push({ t, y: e.clientY });
    while (g.samples.length > 2 && t - g.samples[0].t > VELOCITY_WINDOW_MS) g.samples.shift();
    setDragY(dy);
  }

  function finish(e: PointerEvent<HTMLDivElement>, cancelled: boolean) {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (!g.active) return;
    // The click (if any) that follows this pointerup is dispatched in the same task.
    suppressClick.current = true;
    setTimeout(() => {
      suppressClick.current = false;
    }, 0);
    setDragY(null);
    if (cancelled) return;

    const t = performance.now();
    const dy = e.clientY - g.startY;
    g.samples.push({ t, y: e.clientY });
    const first = g.samples.find((s) => t - s.t <= VELOCITY_WINDOW_MS) ?? g.samples[0];
    const dt = t - first.t;
    // Under one frame of samples there's no meaningful velocity.
    const velocity = dt >= 16 ? (e.clientY - first.y) / dt : 0;

    if (dy < -EXPAND_PX) {
      setExpanded(true);
    } else if (dy > DISMISS_PX || (velocity > FLING_PX_PER_MS && dy > FLING_MIN_PX)) {
      if (expanded) setExpanded(false);
      else onClose();
    }
  }

  function onClickCapture(e: MouseEvent<HTMLDivElement>) {
    // A drag that ends over a tab or button must not activate it.
    if (suppressClick.current) {
      suppressClick.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function onHandleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  }

  const base = !open ? '100%' : expanded ? '0px' : DEFAULT_OFFSET;
  const dragging = dragY !== null;
  const transform = dragging ? `translateY(max(0px, calc(${base} + ${dragY}px)))` : `translateY(${base})`;
  let transition = 'none';
  if (!dragging && !reduced) {
    // Hide only after the slide-out ends; show at once when opening.
    transition = `transform ${DURATION}ms ${EASE}, visibility 0s linear ${open ? 0 : DURATION}ms`;
  }
  const style: CSSProperties = {
    height: `calc(100dvh - ${TOP_EXPANDED})`,
    transform,
    transition,
    visibility: open ? 'visible' : 'hidden',
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label={label}
      aria-hidden={open ? undefined : true}
      inert={!open}
      tabIndex={-1}
      data-state={open ? 'open' : 'closed'}
      data-expanded={expanded ? 'true' : 'false'}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => finish(e, false)}
      onPointerCancel={(e) => finish(e, true)}
      onClickCapture={onClickCapture}
      className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-[640px] flex-col rounded-t-[24px] bg-wash shadow-[0_-8px_30px_rgba(26,26,26,0.12)] outline-none"
    >
      <button
        ref={handleRef}
        type="button"
        aria-label="Resize case study"
        aria-expanded={expanded}
        onClick={toggle}
        onKeyDown={onHandleKeyDown}
        onKeyUp={(e) => {
          if (e.key === ' ') e.preventDefault();
        }}
        className="flex h-6 w-full shrink-0 cursor-grab touch-none items-center justify-center rounded-t-[24px] active:cursor-grabbing"
      >
        <span aria-hidden="true" className="h-1 w-10 rounded-full bg-[#D9D9D9]" />
      </button>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-[10px] [&_[role=tablist]]:touch-pan-x"
        style={{
          paddingBottom: expanded
            ? 'env(safe-area-inset-bottom)'
            : `calc(${DEFAULT_OFFSET} + env(safe-area-inset-bottom))`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
