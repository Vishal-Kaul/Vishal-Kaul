import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubMatchMedia } from '@/test/match-media';
import { BottomSheet } from './BottomSheet';

afterEach(() => {
  vi.unstubAllGlobals();
});

function setup(open = true) {
  stubMatchMedia(false);
  const onClose = vi.fn();
  const utils = render(
    <BottomSheet open={open} onClose={onClose} label="Turbo Mode case study">
      <div role="tablist" aria-label="Case study sections">
        <button type="button" role="tab" aria-selected="true">
          Results
        </button>
      </div>
      <p>Body</p>
    </BottomSheet>,
  );
  return { onClose, ...utils };
}

describe('BottomSheet', () => {
  it('renders a non-modal dialog with its label when open, and focuses the selected tab', () => {
    setup();
    const dialog = screen.getByRole('dialog', { name: 'Turbo Mode case study' });
    expect(dialog).toHaveAttribute('aria-modal', 'false');
    expect(dialog).toHaveAttribute('data-expanded', 'false');
    expect(screen.getByRole('tab', { name: 'Results' })).toHaveFocus();
  });

  it('Escape calls onClose', () => {
    const { onClose } = setup();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('is not in the accessibility tree when closed', () => {
    const { onClose } = setup(false);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('dragging the handle down past 120px closes', () => {
    const { onClose } = setup();
    const handle = screen.getByRole('button', { name: 'Resize case study' });
    fireEvent.pointerDown(handle, { clientY: 300, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerMove(handle, { clientY: 450, pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerUp(handle, { clientY: 450, pointerId: 1, pointerType: 'touch' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a small drag snaps back without closing', () => {
    const { onClose } = setup();
    const handle = screen.getByRole('button', { name: 'Resize case study' });
    fireEvent.pointerDown(handle, { clientY: 300, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientY: 340, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientY: 340, pointerId: 1 });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toHaveAttribute('data-expanded', 'false');
  });

  it('dragging up past 80px expands; dragging down from expanded returns to default', () => {
    const { onClose } = setup();
    const dialog = screen.getByRole('dialog');
    const handle = screen.getByRole('button', { name: 'Resize case study' });
    fireEvent.pointerDown(handle, { clientY: 300, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientY: 200, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientY: 200, pointerId: 1 });
    expect(dialog).toHaveAttribute('data-expanded', 'true');

    fireEvent.pointerDown(handle, { clientY: 100, pointerId: 2 });
    fireEvent.pointerMove(handle, { clientY: 260, pointerId: 2 });
    fireEvent.pointerUp(handle, { clientY: 260, pointerId: 2 });
    expect(dialog).toHaveAttribute('data-expanded', 'false');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('dragging from the tab row also moves the sheet', () => {
    const { onClose } = setup();
    const tab = screen.getByRole('tab', { name: 'Results' });
    fireEvent.pointerDown(tab, { clientY: 300, pointerId: 1 });
    fireEvent.pointerMove(tab, { clientY: 450, pointerId: 1 });
    fireEvent.pointerUp(tab, { clientY: 450, pointerId: 1 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Enter and Space on the handle toggle expanded', () => {
    setup();
    const dialog = screen.getByRole('dialog');
    const handle = screen.getByRole('button', { name: 'Resize case study' });
    fireEvent.keyDown(handle, { key: 'Enter' });
    expect(dialog).toHaveAttribute('data-expanded', 'true');
    expect(handle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(handle, { key: ' ' });
    expect(dialog).toHaveAttribute('data-expanded', 'false');
  });
});
