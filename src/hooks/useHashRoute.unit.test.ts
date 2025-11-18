import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useHashRoute } from './useHashRoute';

describe('useHashRoute', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('defaults to the tile route', () => {
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toBe('tile');
  });

  it('reads the current hash on mount', () => {
    window.location.hash = '#topic';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toBe('topic');
  });

  it('supports navigating directly to the article route', () => {
    window.location.hash = '#article';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toBe('article');
  });

  it('updates the hash when navigating', async () => {
    const { result } = renderHook(() => useHashRoute());

    act(() => {
      result.current.navigate('topic');
    });

    await waitFor(() => {
      expect(result.current.route).toBe('topic');
    });

    expect(window.location.hash).toBe('#topic');
  });

  it('redirects legacy bubble route to tile route', () => {
    window.location.hash = '#bubble';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current.route).toBe('tile');
  });
});
