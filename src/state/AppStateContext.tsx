import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

export type AppState = {
  selectedTopic: string | null;
  setSelectedTopic: (topic: string | null) => void;
};

const AppStateContext = createContext<AppState | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      selectedTopic,
      setSelectedTopic,
    }),
    [selectedTopic],
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
