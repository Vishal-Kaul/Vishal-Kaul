import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { stubMatchMedia } from '@/test/match-media';
import Page from './page';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Page', () => {
  it('renders the visually hidden page heading', async () => {
    stubMatchMedia(false);
    render(await Page({ searchParams: Promise.resolve({}) }));
    const h1 = screen.getByRole('heading', { level: 1, name: 'Vishal Kaul' });
    expect(h1).toHaveClass('sr-only');
  });

  it('passes embed=1 through (no brand in the mobile top bar)', async () => {
    stubMatchMedia(false);
    render(await Page({ searchParams: Promise.resolve({ embed: '1' }) }));
    expect(screen.getAllByText('Vishal Kaul')).toHaveLength(1); // only the sr-only h1
    expect(screen.getByText('AI assistant for Vishal')).toBeInTheDocument();
  });
});
