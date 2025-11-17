import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppStateProvider, useAppState } from './AppStateContext';

const wrapper = ({ children }: { children: ReactNode }) => <AppStateProvider>{children}</AppStateProvider>;

describe('AppStateContext', () => {
  it('provides default null selections with setters', () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    expect(result.current.selectedTopic).toBeNull();
    expect(result.current.selectedHeadline).toBeNull();

    act(() => {
      result.current.setSelectedTopic('AI Regulation');
      result.current.setSelectedHeadline({
        title: 'Sample',
        summary: 'Summary',
        source: 'Test',
        url: 'https://example.com',
        publishedAt: new Date().toISOString(),
      });
    });

    expect(result.current.selectedTopic).toBe('AI Regulation');
    expect(result.current.selectedHeadline?.title).toBe('Sample');
  });

  it('throws when used outside of the provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useAppState())).toThrow(/useAppState must be used/);
    consoleError.mockRestore();
  });
});
