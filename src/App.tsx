import { useEffect, useMemo, useState } from 'react';
import './App.css';

type Route = { view: 'radar' } | { view: 'topic'; topic: string };

type Phrase = {
  phrase: string;
  summary: string;
  weight: number;
};

const PLACEHOLDER_PHRASES: Phrase[] = [
  { phrase: 'Global Supply Chains', summary: 'Manufacturing corridors & shipping costs', weight: 42 },
  { phrase: 'Election Integrity', summary: 'Voter access, audits, and reforms', weight: 33 },
  { phrase: 'AI Regulation', summary: 'Governance for foundation models', weight: 27 },
  { phrase: 'Ceasefire Talks', summary: 'Diplomatic efforts across regions', weight: 31 },
  { phrase: 'Climate Finance', summary: 'Funding the energy transition', weight: 24 },
  { phrase: 'Rare Earth Metals', summary: 'Mining headlines in the Indo-Pacific', weight: 18 },
];

const parseRoute = (hash: string): Route => {
  const cleaned = hash.replace(/^#/, '');
  const segments = cleaned.split('/').filter(Boolean);

  if (segments[0] === 'topic' && segments[1]) {
    return { view: 'topic', topic: decodeURIComponent(segments.slice(1).join('/')) };
  }

  return { view: 'radar' };
};

const bubbleSize = (weight: number) => {
  const min = 90;
  const max = 170;
  const clamped = Math.max(0, Math.min(weight, 50));
  const ratio = clamped / 50;
  return Math.round(min + (max - min) * ratio);
};

function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseRoute(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const preparedPhrases = useMemo(
    () =>
      PLACEHOLDER_PHRASES.map((item) => ({
        ...item,
        size: bubbleSize(item.weight),
      })),
    [],
  );

  const handleSelectTopic = (topic: string) => {
    window.location.hash = `#/topic/${encodeURIComponent(topic)}`;
    setRoute({ view: 'topic', topic });
  };

  const handleBackToRadar = () => {
    window.location.hash = '';
    setRoute({ view: 'radar' });
  };

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

      <section className="view-container" aria-live="polite">
        {route.view === 'radar' ? (
          <BubbleMapView phrases={preparedPhrases} onSelectTopic={handleSelectTopic} />
        ) : (
          <TopicView topic={route.topic} onBack={handleBackToRadar} />
        )}
      </section>
    </div>
  );
}

type BubbleMapViewProps = {
  phrases: Array<Phrase & { size: number }>;
  onSelectTopic: (topic: string) => void;
};

const BubbleMapView = ({ phrases, onSelectTopic }: BubbleMapViewProps) => (
  <article className="panel">
    <div className="panel-header">
      <div>
        <p className="panel-kicker">Bubble map</p>
        <h2>Today&apos;s placeholder radar sweep</h2>
      </div>
      <p className="panel-note">This static layout will soon wire into live headline data.</p>
    </div>

    <div className="bubble-grid" role="list">
      {phrases.map((item) => (
        <button
          key={item.phrase}
          className="bubble-button"
          style={{ width: item.size, height: item.size }}
          onClick={() => onSelectTopic(item.phrase)}
        >
          <span className="bubble-label">{item.phrase}</span>
        </button>
      ))}
    </div>
    <p className="helper-text">Tip: choose a bubble to navigate to the Topic View prototype.</p>
  </article>
);

type TopicViewProps = {
  topic: string;
  onBack: () => void;
};

const TopicView = ({ topic, onBack }: TopicViewProps) => (
  <article className="panel topic-panel">
    <button className="ghost-button" onClick={onBack}>
      ← Back to bubble map
    </button>
    <p className="panel-kicker">Topic view prototype</p>
    <h2>{topic}</h2>
    <p>
      This placeholder topic view confirms the internal router works. In later steps we&apos;ll hydrate this space with
      cross-source article results, filters, and summaries.
    </p>
    <div className="topic-placeholder">
      <p>Article list incoming…</p>
    </div>
  </article>
);

export default App;
