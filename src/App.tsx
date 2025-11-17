import './App.css';
import BubbleView from './components/BubbleView';
import TopicView from './components/TopicView';
import BranchIndicator from './components/BranchIndicator';
import { useHashRoute } from './hooks/useHashRoute';
import { useHeadlines } from './hooks/useHeadlines';
import { AppStateProvider, useAppState } from './state/AppStateContext';

const formatUpdatedAt = (iso?: string) => {
  if (!iso) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return '';
  }
};

const AppShell = () => {
  const { route, navigate } = useHashRoute();
  const { selectedTopic, setSelectedTopic } = useAppState();
  const headlinesState = useHeadlines();
  const { headlines, lastUpdated, loading } = headlinesState;
  const headlineCount = headlines.length;
  const sourceCount = new Set(headlines.map((headline) => headline.source)).size || 4;

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
          <h1>See the issues every outlet repeats today</h1>
          <p className="app__lead">
            We cluster Guardian, NYT, NPR, and Reuters headlines into weighted phrases so you can scan the daily news landscape
            in seconds.
          </p>
          <div className="app__meta" role="status" aria-live="polite">
            <span>
              {lastUpdated ? `Updated ${formatUpdatedAt(lastUpdated)}` : loading ? 'Fetching latest radar…' : 'Using cached radar'}
            </span>
            <span>{headlineCount ? `${headlineCount} headlines` : 'Gathering headlines'}</span>
            <span>{`${sourceCount} sources`}</span>
          </div>
        </header>

        {route === 'bubble' ? (
          <BubbleView onSelectTopic={handleSelectTopic} {...headlinesState} />
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
