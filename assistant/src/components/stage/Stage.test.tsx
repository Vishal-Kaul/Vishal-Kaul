import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Stage, WelcomeStage, CaseStudyStage, MobileHero } from './index';

function stubMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}


afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WelcomeStage', () => {
  it('renders heading, proof tiles and lists', () => {
    const onAsk = vi.fn();
    render(<WelcomeStage onAsk={onAsk} />);
    expect(screen.getByRole('heading', { name: 'Ask me about Vishal’s work.' })).toBeInTheDocument();
    const first = screen.getByRole('button', { name: 'Ask about Turbo Mode' });
    expect(screen.getByRole('button', { name: 'Ask about Trade Ideas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ask about Fisdom Revamp' })).toBeInTheDocument();
    fireEvent.click(first);
    expect(onAsk).toHaveBeenCalledWith('Turbo Mode');
    expect(screen.getByText('44%')).toBeInTheDocument();
    expect(screen.getByText('4 prices')).toBeInTheDocument();
    expect(screen.getByText('+32%')).toBeInTheDocument();
    expect(screen.getByText('Discuss pay or other offers')).toBeInTheDocument();
  });
});

describe('CaseStudyStage', () => {
  const results = { view: 'project', project: 'turbo-mode', tab: 'results' } as const;

  it('renders results tab', () => {
    render(<Stage stage={results} onTab={() => {}} onAsk={() => {}} variant="desktop" />);
    const tabs = within(screen.getByRole('tablist')).getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    expect(screen.getByRole('tab', { name: 'Results' })).toHaveAttribute('aria-selected', 'true');
    const h = screen.getByRole('heading', { level: 2 });
    expect(h.textContent).toContain('From 10+ taps to');
    const span = within(h).getByText('2.');
    expect(span).toHaveClass('text-brand');
    for (const v of ['8,352', '6,117 · 73%', '4,849 · 79%', '3,683 · 76%']) {
      expect(screen.getByText(v)).toBeInTheDocument();
    }
    const link = screen.getByRole('link', { name: /Open full case study/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('supports keyboard navigation', () => {
    const onTab = vi.fn();
    const { rerender } = render(
      <CaseStudyStage project="turbo-mode" tab="results" onTab={onTab} variant="desktop" />,
    );
    const results = screen.getByRole('tab', { name: 'Results' });
    results.focus();
    fireEvent.keyDown(results, { key: 'ArrowRight' });
    expect(onTab).toHaveBeenLastCalledWith('learnings');
    rerender(<CaseStudyStage project="turbo-mode" tab="learnings" onTab={onTab} variant="desktop" />);
    const learnings = screen.getByRole('tab', { name: 'Learnings' });
    fireEvent.keyDown(learnings, { key: 'ArrowRight' });
    expect(onTab).toHaveBeenLastCalledWith('overview');
    fireEvent.keyDown(learnings, { key: 'Home' });
    expect(onTab).toHaveBeenLastCalledWith('overview');
    fireEvent.keyDown(learnings, { key: 'End' });
    expect(onTab).toHaveBeenLastCalledWith('learnings');
  });

  it('shows placeholder', () => {
    render(<CaseStudyStage project="trade-ideas" tab="overview" onTab={() => {}} variant="desktop" />);
    expect(screen.getByText('Details coming soon.')).toBeInTheDocument();
  });

  it('sheet variant', () => {
    const onClose = vi.fn();
    render(<CaseStudyStage project="turbo-mode" tab="results" onTab={() => {}} variant="sheet" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back to chat' }));
    expect(onClose).toHaveBeenCalled();
    expect(screen.getByText('44% placed an order')).toBeInTheDocument();
    expect(screen.getByText('8,352 traders')).toBeInTheDocument();
    expect(screen.queryByText('Turbo Mode · case study')).not.toBeInTheDocument();
  });
});

describe('Stage motion', () => {
  const welcome = { view: 'welcome' } as const;
  it('reduced motion disables animation', () => {
    stubMotion(true);
    const { container } = render(<Stage stage={welcome} onTab={() => {}} onAsk={() => {}} variant="desktop" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveAttribute('data-reduced', 'true');
    const all = container.querySelectorAll('*');
    for (const el of [wrapper, ...Array.from(all)]) {
      expect(el.getAttribute('class') ?? '').not.toContain('animate-');
    }
  });
  it('animates otherwise', () => {
    stubMotion(false);
    const { container } = render(<Stage stage={welcome} onTab={() => {}} onAsk={() => {}} variant="desktop" />);
    expect((container.firstElementChild as HTMLElement).className).toContain('animate-');
  });
});

describe('MobileHero', () => {
  it('shows tiles', () => {
    render(<MobileHero />);
    for (const t of ['44%', 'ordered in Turbo Mode', '+32%', 'Fisdom conversion']) {
      expect(screen.getByText(t)).toBeInTheDocument();
    }
  });
});
