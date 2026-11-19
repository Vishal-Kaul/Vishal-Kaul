import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import { stubMatchMedia } from '@/test/match-media';
import { useMediaQuery } from './use-media-query';

const Q = '(min-width: 1024px)';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useMediaQuery', () => {
  it('returns true when the query matches', () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery(Q));
    expect(result.current).toBe(true);
  });

  it('returns false when the query does not match', () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery(Q));
    expect(result.current).toBe(false);
  });

  it('updates on a change event', () => {
    const mm = stubMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery(Q));
    expect(result.current).toBe(false);
    act(() => mm.setDesktop(true));
    expect(result.current).toBe(true);
    act(() => mm.setDesktop(false));
    expect(result.current).toBe(false);
  });

  it('is null in server rendering (before mount)', () => {
    stubMatchMedia(true);
    function Probe() {
      const v = useMediaQuery(Q);
      return createElement('span', null, String(v));
    }
    expect(renderToString(createElement(Probe))).toBe('<span>null</span>');
  });
});
