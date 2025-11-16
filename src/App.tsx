import './App.css';
import BubbleView from './components/BubbleView';
import TopicView from './components/TopicView';
import BranchIndicator from './components/BranchIndicator';
import { useHashRoute } from './hooks/useHashRoute';
import { AppStateProvider, useAppState } from './state/AppStateContext';

const AppShell = () => {
  const { route, navigate } = useHashRoute();
  const { selectedTopic, setSelectedTopic } = useAppState();

  const handleSelectTopic = (topic: string) => {
    setSelectedTopic(topic);
    navigate('topic');
  };

  const handleBack = () => {
    navigate('bubble');
  };

  return (
    <>
      <BranchIndicator />
      <main className="app">
        <header className="app__header">
          <p className="eyebrow">Morning Issue Radar</p>
          <h1>Issue-centric news at a glance</h1>
          <p className="app__lead">
            Step 1 scaffolds the Single Page Application with a hash-based router, two core views, and preserved UI state. Use it
            as the launching pad for the data-powered modules described in the spec.
          </p>
        </header>

        {route === 'bubble' ? (
          <BubbleView onSelectTopic={handleSelectTopic} />
        ) : (
          <TopicView topic={selectedTopic} onBack={handleBack} />
        )}
      </main>
    </>
  );
};

const App = () => (
  <AppStateProvider>
    <AppShell />
  </AppStateProvider>
);

export default App;
