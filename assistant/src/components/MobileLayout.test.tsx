import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { initialState } from '@/lib/conversation';
import type { ConvState, Conversation } from '@/lib/types';
import { MobileLayout } from './MobileLayout';

// The real sheet's gestures are covered in BottomSheet.test; here we only need
// to close it with each reason.
vi.mock('./mobile/BottomSheet', () => ({
  SHEET_TOP: 178,
  BottomSheet: ({
    open,
    onClose,
    children,
  }: {
    open: boolean;
    onClose: (reason?: 'escape' | 'button' | 'swipe') => void;
    children: ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-label="sheet">
        <button type="button" onClick={() => onClose('swipe')}>
          swipe
        </button>
        <button type="button" onClick={() => onClose('escape')}>
          escape
        </button>
        <button type="button" onClick={() => onClose()}>
          no reason
        </button>
        {children}
      </div>
    ) : null,
}));

function conv(partial: Partial<ConvState> = {}): Conversation {
  return {
    state: { ...initialState(), ...partial },
    send: vi.fn(() => true),
    setTab: vi.fn(),
    showWelcome: vi.fn(),
    retry: vi.fn(),
    slow: 'none',
  };
}

const onTurbo: Partial<ConvState> = { stage: { view: 'project', project: 'turbo-mode', tab: 'results' } };

function setup() {
  const composerRef = createRef<HTMLTextAreaElement>();
  const ui = (c: Conversation) => (
    <MobileLayout conv={c} embed={false} composerRef={composerRef} onAsk={() => {}} />
  );
  const view = render(ui(conv({ ...onTurbo, showSeq: 0 })));
  const rerender = (c: Conversation) => view.rerender(ui(c));
  return { composerRef, rerender };
}

/** The composer's row: the textarea's ancestor that sits beside the message log. */
function composerRow(textarea: HTMLElement): HTMLElement {
  const log = screen.getByRole('log');
  let el: HTMLElement = textarea;
  while (el.parentElement && !el.parentElement.contains(log)) el = el.parentElement;
  return el;
}

describe('MobileLayout', () => {
  it('opens the sheet when showSeq increases, not on other changes', () => {
    const { rerender } = setup();
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(conv({ stage: { view: 'project', project: 'turbo-mode', tab: 'overview' }, showSeq: 0 }));
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(conv({ ...onTurbo, showSeq: 1 }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('makes the composer row inert while the sheet is open', async () => {
    const user = userEvent.setup();
    const { composerRef, rerender } = setup();
    const row = composerRow(composerRef.current!);
    expect(row).not.toHaveAttribute('inert');
    rerender(conv({ ...onTurbo, showSeq: 1 }));
    expect(row).toHaveAttribute('inert');
    expect(row).toContainElement(composerRef.current);
    await user.click(screen.getByRole('button', { name: 'escape' }));
    expect(row).not.toHaveAttribute('inert');
  });

  it.each([
    ['escape', true],
    ['no reason', true],
    ['Back to chat', true],
    ['swipe', false],
  ] as const)('closing via %s returns focus to the composer: %s', async (how, focuses) => {
    const user = userEvent.setup();
    const { composerRef, rerender } = setup();
    rerender(conv({ ...onTurbo, showSeq: 1 }));
    await user.click(screen.getByRole('button', { name: how }));
    expect(screen.queryByRole('dialog')).toBeNull();
    if (focuses) expect(composerRef.current).toHaveFocus();
    else expect(composerRef.current).not.toHaveFocus();
  });
});
