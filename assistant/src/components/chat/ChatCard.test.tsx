import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Conversation, ConvState, SlowLevel } from '@/lib/types';
import { ChatCard } from './ChatCard';
import { DateDivider } from './DateDivider';

const GREETING =
  'Hi! I’m Vishal’s AI assistant. I can tell you about his work, check when he’s free for a call, or take a message. What brings you here?';

function makeConv(partial: Partial<ConvState> = {}, extra: { slow?: SlowLevel } = {}) {
  const conv = {
    state: {
      status: 'idle',
      seq: 1,
      messages: [{ id: 'm1', role: 'assistant', text: GREETING }],
      quickReplies: ['I’m hiring', 'Just curious', 'Show me his work'],
      stage: { view: 'welcome' },
      ...partial,
    } as ConvState,
    send: vi.fn(),
    setTab: vi.fn(),
    showWelcome: vi.fn(),
    retry: vi.fn(),
    slow: extra.slow ?? 'none',
  } satisfies Conversation;
  return conv;
}

describe('ChatCard', () => {
  it('renders greeting, chips, badge and footer', () => {
    render(<ChatCard conv={makeConv()} variant="desktop" />);
    expect(screen.getByText(GREETING)).toBeInTheDocument();
    for (const c of ['I’m hiring', 'Just curious', 'Show me his work']) {
      expect(screen.getByRole('button', { name: c })).toBeInTheDocument();
    }
    expect(screen.getByText('AI assistant for Vishal')).toBeInTheDocument();
    expect(screen.getByText('I’m an AI. I can’t make commitments on Vishal’s behalf.')).toBeInTheDocument();
  });

  it('DateDivider formats time', async () => {
    render(<DateDivider now={new Date(2026, 10, 19, 12, 40)} />);
    expect(await screen.findByText('Today · 12:40')).toBeInTheDocument();
  });

  it('clicking a chip sends it', async () => {
    const conv = makeConv();
    render(<ChatCard conv={conv} variant="desktop" />);
    await userEvent.click(screen.getByRole('button', { name: 'Show me his work' }));
    expect(conv.send).toHaveBeenCalledWith('Show me his work');
  });

  it('Enter sends, Shift+Enter newline, whitespace ignored', async () => {
    const conv = makeConv();
    render(<ChatCard conv={conv} variant="desktop" />);
    const box = screen.getByLabelText('Message Vishal’s assistant') as HTMLTextAreaElement;
    await userEvent.type(box, 'hello{Enter}');
    expect(conv.send).toHaveBeenCalledWith('hello');
    expect(box.value).toBe('');
    expect(box).toHaveFocus();

    conv.send.mockClear();
    await userEvent.type(box, 'a{Shift>}{Enter}{/Shift}b');
    expect(conv.send).not.toHaveBeenCalled();
    expect(box.value).toBe('a\nb');

    await userEvent.clear(box);
    await userEvent.type(box, '   {Enter}');
    expect(conv.send).not.toHaveBeenCalled();
  });

  it('limits to 1000 characters with a notice', async () => {
    const conv = makeConv();
    render(<ChatCard conv={conv} variant="desktop" />);
    const box = screen.getByLabelText('Message Vishal’s assistant');
    fireEvent.change(box, { target: { value: 'a'.repeat(1001) } });
    expect(screen.getByText('Messages are limited to 1,000 characters.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(conv.send).toHaveBeenCalledWith('a'.repeat(1000));
  });

  it('mic button becomes send button', async () => {
    const conv = makeConv();
    render(<ChatCard conv={conv} variant="desktop" />);
    const mic = screen.getByRole('button', { name: 'Voice (coming soon)' });
    await userEvent.click(mic);
    expect(conv.send).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText('Message Vishal’s assistant'), 'hi');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(conv.send).toHaveBeenCalledWith('hi');
  });

  it('thinking shows typing dots and announcer; streaming does not', () => {
    const { rerender } = render(<ChatCard conv={makeConv({ status: 'thinking' })} variant="desktop" />);
    expect(screen.getByTestId('typing')).toBeInTheDocument();
    expect(screen.getByText('Thinking')).toBeInTheDocument();
    rerender(
      <ChatCard
        conv={makeConv({
          status: 'streaming',
          messages: [
            { id: 'm1', role: 'user', text: 'hey' },
            { id: 'm2', role: 'assistant', text: 'Hel' },
          ],
        })}
        variant="desktop"
      />,
    );
    expect(screen.queryByTestId('typing')).not.toBeInTheDocument();
  });

  it('error state', async () => {
    const conv = makeConv({ status: 'error', error: 'Something went wrong on my side.' });
    render(<ChatCard conv={conv} variant="desktop" />);
    expect(screen.getAllByText('Something went wrong on my side.').length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(conv.retry).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Or leave a message for Vishal' })).toBeInTheDocument();
  });

  it('slow long', async () => {
    const conv = makeConv({ status: 'thinking' }, { slow: 'long' });
    render(<ChatCard conv={conv} variant="desktop" />);
    expect(screen.getByText('This is taking longer than usual.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(conv.retry).toHaveBeenCalled();
  });

  it('renders activity message', () => {
    render(
      <ChatCard
        conv={makeConv({ messages: [{ id: 'm2', role: 'activity', text: 'Pulling up the Turbo Mode case study' }] })}
        variant="desktop"
      />,
    );
    expect(screen.getByText('Pulling up the Turbo Mode case study')).toBeInTheDocument();
  });

  it('shows New message pill when scrolled up', async () => {
    const conv = makeConv();
    const { rerender } = render(<ChatCard conv={conv} variant="desktop" />);
    const log = screen.getByRole('log');
    Object.defineProperty(log, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(log, 'clientHeight', { configurable: true, value: 300 });
    log.scrollTop = 0;
    fireEvent.scroll(log);
    const next = makeConv({
      messages: [...conv.state.messages, { id: 'm2', role: 'assistant', text: 'More' }],
    });
    rerender(<ChatCard conv={next} variant="desktop" />);
    const pill = screen.getByRole('button', { name: 'New message' });
    await userEvent.click(pill);
    expect(screen.queryByRole('button', { name: 'New message' })).not.toBeInTheDocument();
  });

  it('mobile variant', () => {
    render(<ChatCard conv={makeConv()} variant="mobile" />);
    expect(screen.getByText('I’m an AI. I can’t make commitments for Vishal.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type, or tap the mic to talk')).toBeInTheDocument();
    expect(screen.queryByText('AI assistant for Vishal')).not.toBeInTheDocument();
    expect(within(document.body).queryByRole('region')).not.toBeInTheDocument();
  });
  it('renders leading content first and trailing content last in the log, and can hide the date', async () => {
    render(<ChatCard conv={makeConv()} variant="mobile" leading={<p>Hero</p>} trailing={<p>End</p>} hideDate />);
    const log = screen.getByRole('log');
    expect(log.firstElementChild).toHaveTextContent('Hero');
    expect(log.lastElementChild).toHaveTextContent('End');
    // give DateDivider's effect a chance to fill in a label if it were rendered
    await screen.findByText('Hero');
    expect(within(log).queryByText(/^Today · /)).not.toBeInTheDocument();
  });

  it('shows the date divider by default', async () => {
    render(<ChatCard conv={makeConv()} variant="desktop" />);
    expect(await screen.findByText(/^Today · \d\d:\d\d$/)).toBeInTheDocument();
  });

  it('activity pills are static without onActivityClick', () => {
    const conv = makeConv({
      messages: [
        { id: 'm1', role: 'assistant', text: GREETING },
        { id: 'm2', role: 'activity', text: 'Pulling up the Turbo Mode case study' },
      ],
    });
    render(<ChatCard conv={conv} variant="desktop" />);
    expect(screen.getByText('Pulling up the Turbo Mode case study')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pulling up/ })).not.toBeInTheDocument();
  });

  it('with onActivityClick the latest activity pill is a reopen button', async () => {
    const onActivityClick = vi.fn();
    const conv = makeConv({
      messages: [
        { id: 'm1', role: 'assistant', text: GREETING },
        { id: 'm2', role: 'activity', text: 'Pulling up the Turbo Mode case study' },
        { id: 'm3', role: 'activity', text: 'Pulling up the Fisdom Revamp case study' },
      ],
    });
    render(<ChatCard conv={conv} variant="mobile" onActivityClick={onActivityClick} />);
    expect(screen.queryByRole('button', { name: 'Open: Pulling up the Turbo Mode case study' })).not.toBeInTheDocument();
    const pill = screen.getByRole('button', { name: 'Open: Pulling up the Fisdom Revamp case study' });
    expect(pill).toHaveAttribute('type', 'button');
    await userEvent.click(pill);
    expect(onActivityClick).toHaveBeenCalledTimes(1);
  });
});
