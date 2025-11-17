import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import type { Headline } from '../services/fetchHeadlines';

export type AppState = {
  selectedTopic: string | null;
  setSelectedTopic: (topic: string | null) => void;
  selectedHeadline: Headline | null;
  setSelectedHeadline: (headline: Headline | null) => void;
};

const AppStateContext = createContext<AppState | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedHeadline, setSelectedHeadline] = useState<Headline | null>(null);

  const value = useMemo(
    () => ({
      selectedTopic,
      setSelectedTopic,
      selectedHeadline,
      setSelectedHeadline,
    }),
    [selectedTopic, selectedHeadline],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }

  return context;
};
