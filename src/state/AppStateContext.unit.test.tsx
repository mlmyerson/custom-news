import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppStateProvider, useAppState } from './AppStateContext';

const wrapper = ({ children }: { children: ReactNode }) => <AppStateProvider>{children}</AppStateProvider>;

describe('AppStateContext', () => {
  it('provides a default null topic with a setter', () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    expect(result.current.selectedTopic).toBeNull();

    act(() => {
      result.current.setSelectedTopic('AI Regulation');
    });

    expect(result.current.selectedTopic).toBe('AI Regulation');
  });

  it('throws when used outside of the provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useAppState())).toThrow(/useAppState must be used/);
    consoleError.mockRestore();
  });
});
