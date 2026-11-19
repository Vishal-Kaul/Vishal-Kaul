import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockSource } from '@/lib/mock-source';
import { stubMatchMedia } from '@/test/match-media';
import { AssistantApp } from './AssistantApp';

const BOX = 'Message Vishal’s assistant';
const fast = () => createMockSource({ tokenDelayMs: 0, firstTokenDelayMs: 0 });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AssistantApp (desktop)', () => {
  it('renders the nav; "Talk to my assistant" focuses the composer', async () => {
    stubMatchMedia(true);
    render(<AssistantApp source={fast()} />);
    const nav = screen.getByRole('navigation');
    for (const name of ['Work', 'About', 'Resume']) {
      const link = within(nav).getByRole('link', { name });
      expect(link).toHaveAttribute('href', 'https://vishaluxi.framer.website/');
      expect(link).toHaveAttribute('target', '_top');
    }
    expect(screen.getByText('Senior Product Designer')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Talk to my assistant' }));
    expect(screen.getByRole('textbox', { name: BOX })).toHaveFocus();
  });

  it('a proof tile asks about the project and the stage shows the case study', async () => {
    stubMatchMedia(true);
    render(<AssistantApp source={fast()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Ask about Turbo Mode' }));
    expect(await screen.findByText('Tell me about Turbo Mode')).toBeInTheDocument();
    expect(await screen.findByRole('tab', { name: 'Results', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /From 10\+ taps to/ })).toBeInTheDocument();
    expect(screen.getByText('Pulling up the Turbo Mode case study')).toBeInTheDocument();
    // Desktop has no sheet: the pill is not a button and there is no dialog.
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: /Pulling up/ })).toBeNull();
  });

  it('embed mode hides the nav', () => {
    stubMatchMedia(true);
    render(<AssistantApp embed source={fast()} />);
    expect(screen.queryByRole('button', { name: 'Talk to my assistant' })).toBeNull();
    expect(screen.queryByText('Senior Product Designer')).toBeNull();
    expect(screen.getByRole('textbox', { name: BOX })).toBeInTheDocument();
  });

  it('renders children (the page heading) inside main', () => {
    stubMatchMedia(true);
    render(
      <AssistantApp source={fast()}>
        <h1>Heading</h1>
      </AssistantApp>,
    );
    expect(within(screen.getByRole('main')).getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});

describe('AssistantApp (mobile)', () => {
  it('hero, sheet auto-open, Escape, reopen from the pill, Back to chat', async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    render(<AssistantApp source={fast()} />);
    expect(screen.getByText('ordered in Turbo Mode')).toBeInTheDocument();
    expect(screen.getByText('Fisdom conversion')).toBeInTheDocument();
    expect(screen.getByText('Vishal Kaul')).toBeInTheDocument();
    expect(screen.getByText('AI assistant for Vishal')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();

    const box = screen.getByRole('textbox', { name: BOX });
    await user.type(box, 'Tell me about Turbo Mode{Enter}');
    const dialog = await screen.findByRole('dialog', { name: 'Turbo Mode case study' });
    expect(screen.queryByText('ordered in Turbo Mode')).toBeNull();
    const tab = within(dialog).getByRole('tab', { name: 'Results', selected: true });
    expect(tab).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(box).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Open: Pulling up the Turbo Mode case study' }));
    expect(screen.getByRole('dialog', { name: 'Turbo Mode case study' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to chat' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(box).toHaveFocus();
  });

  it('tab switches keep the sheet; a new project reopens it; asking again reopens it', async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    render(<AssistantApp source={fast()} />);
    const box = screen.getByRole('textbox', { name: BOX });
    await user.type(box, 'Tell me about Turbo Mode{Enter}');
    const dialog = await screen.findByRole('dialog', { name: 'Turbo Mode case study' });
    // let the reply finish streaming
    await screen.findByText('Want the numbers, or how he got there?');

    await user.click(within(dialog).getByRole('tab', { name: 'Overview' }));
    expect(within(dialog).getByRole('tab', { name: 'Overview', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Turbo Mode case study' })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Back to chat' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    // Asking about the same project again reopens the sheet.
    await user.type(box, 'Tell me about Turbo Mode{Enter}');
    expect(await screen.findByRole('dialog', { name: 'Turbo Mode case study' })).toBeInTheDocument();
    // reply done: its quick replies are back
    expect(await screen.findByRole('button', { name: 'The numbers' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.type(box, 'Fisdom{Enter}');
    expect(await screen.findByRole('dialog', { name: 'Fisdom Revamp case study' })).toBeInTheDocument();
    await screen.findByText(/lifted conversion by 32%/);
    expect(screen.getAllByRole('button', { name: /^Open: / })).toHaveLength(1);

    await user.keyboard('{Escape}');
    await user.type(box, 'Tell me about Turbo Mode{Enter}');
    expect(await screen.findByRole('dialog', { name: 'Turbo Mode case study' })).toBeInTheDocument();
  });

  it('"The numbers" chip reopens the sheet for the project already on stage', async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    render(<AssistantApp source={fast()} />);
    const box = screen.getByRole('textbox', { name: BOX });
    await user.type(box, 'Tell me about Turbo Mode{Enter}');
    await screen.findByRole('dialog', { name: 'Turbo Mode case study' });
    await screen.findByRole('button', { name: 'The numbers' });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'The numbers' }));
    expect(await screen.findByRole('dialog', { name: 'Turbo Mode case study' })).toBeInTheDocument();
  });

  it('the composer is inert while the sheet is open', async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    render(<AssistantApp source={fast()} />);
    const box = screen.getByRole('textbox', { name: BOX });
    expect(box.closest('[inert]')).toBeNull();
    await user.type(box, 'Fisdom{Enter}');
    await screen.findByRole('dialog', { name: 'Fisdom Revamp case study' });
    expect(box.closest('[inert]')).not.toBeNull();
    // the sheet itself stays usable
    expect(screen.getByRole('dialog').closest('[inert]')).toBeNull();
    await user.keyboard('{Escape}');
    expect(box.closest('[inert]')).toBeNull();
  });

  it('embed mode hides the brand but keeps the trust badge', () => {
    stubMatchMedia(false);
    render(<AssistantApp embed source={fast()} />);
    expect(screen.queryByText('Vishal Kaul')).toBeNull();
    expect(screen.getByText('AI assistant for Vishal')).toBeInTheDocument();
  });

  it('switches layout when the viewport crosses 1024px', async () => {
    const mm = stubMatchMedia(false);
    render(<AssistantApp source={fast()} />);
    expect(screen.queryByRole('navigation')).toBeNull();
    mm.setDesktop(true);
    await waitFor(() => expect(screen.getByRole('navigation')).toBeInTheDocument());
  });
});

describe('AssistantApp (server render)', () => {
  it('renders only an empty main before mount', () => {
    stubMatchMedia(true);
    const html = renderToString(<AssistantApp source={fast()} />);
    expect(html).toMatch(/^<main[^>]*><\/main>$/);
  });
});
