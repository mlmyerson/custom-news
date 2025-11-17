import './App.css';
import { useEffect } from 'react';
import BubbleView from './components/BubbleView';
import TopicView from './components/TopicView';
import { useHashRoute } from './hooks/useHashRoute';
import { useHeadlines } from './hooks/useHeadlines';
import { AppStateProvider, useAppState } from './state/AppStateContext';
import { useArticleSearch } from './hooks/useArticleSearch';
import type { Headline } from './services/fetchHeadlines';

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
  const { selectedTopic, setSelectedTopic, selectedHeadline, setSelectedHeadline } = useAppState();
  const headlinesState = useHeadlines();
  const { headlines, lastUpdated, loading } = headlinesState;
  const articleSearchState = useArticleSearch(selectedTopic);
  const headlineCount = headlines.length;
  const sourceCount = new Set(headlines.map((headline) => headline.source)).size || 4;

  useEffect(() => {
    if (selectedHeadline && !headlines.some((headline) => headline.url === selectedHeadline.url)) {
      setSelectedHeadline(null);
    }
  }, [headlines, selectedHeadline, setSelectedHeadline]);

  const handleSelectHeadline = (headline: Headline) => {
    setSelectedHeadline(headline);
    setSelectedTopic(headline.title);
    navigate('bubble');
  };

  const handleShowTopic = () => {
    if (selectedTopic) {
      navigate('topic');
    }
  };

  const handleBack = () => {
    navigate('bubble');
  };

  return (
    <>
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
          <BubbleView
            {...headlinesState}
            selectedHeadline={selectedHeadline}
            onSelectHeadline={handleSelectHeadline}
            onExploreTopic={handleShowTopic}
          />
        ) : (
          <TopicView topic={selectedTopic} onBack={handleBack} {...articleSearchState} />
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
