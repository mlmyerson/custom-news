import { useEffect, useMemo, useState } from 'react';
import BubbleMapView from './components/BubbleMapView';
import TopicView from './components/TopicView';
import { placeholderPhrases } from './mocks/phrases';
import { HashRouterProvider, useHashRouter } from './router/HashRouter';
import './App.css';

const bubbleSize = (weight: number) => {
  const min = 90;
  const max = 170;
  const clamped = Math.max(0, Math.min(weight, 50));
  const ratio = clamped / 50;
  return Math.round(min + (max - min) * ratio);
};

const AppShell = () => {
  const { route, navigate } = useHashRouter();
  const [liveMessage, setLiveMessage] = useState('Bubble map ready. Choose a topic to explore.');

  const preparedPhrases = useMemo(
    () =>
      placeholderPhrases.map((item) => ({
        ...item,
        size: bubbleSize(item.weight),
      })),
    [],
  );

  const handleSelectTopic = (topic: string) => {
    setLiveMessage(`Topic view loading for ${topic}`);
    navigate({ view: 'topic', topic });
  };

  const handleBackToRadar = () => {
    setLiveMessage('Returned to bubble map.');
    navigate({ view: 'radar' });
  };

  useEffect(() => {
    if (route.view === 'radar') {
      setLiveMessage('Bubble map ready. Choose a topic to explore.');
    } else {
      setLiveMessage(`Topic view loaded for ${route.topic}.`);
    }
  }, [route]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Morning Issue Radar · Draft 1</p>
        <h1 className="headline">Issue-centric daily overview</h1>
        <p className="subhead">
          Step 1 focuses on a simple router and placeholder bubble map. Click any bubble to preview the upcoming Topic
          View.
        </p>
      </header>

      <section className="view-container">
        {route.view === 'radar' ? (
          <BubbleMapView phrases={preparedPhrases} onSelectTopic={handleSelectTopic} />
        ) : (
          <TopicView topic={route.topic} onBack={handleBackToRadar} />
        )}
      </section>

      <p className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </p>
    </div>
  );
};

const App = () => (
  <HashRouterProvider>
    <AppShell />
  </HashRouterProvider>
);

export default App;
