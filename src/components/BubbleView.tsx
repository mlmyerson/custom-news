import './BubbleView.css';
import { useHeadlines } from '../hooks/useHeadlines';
import type { Headline } from '../services/fetchHeadlines';

const SAMPLE_TOPICS: Headline[] = [
  {
    title: 'Global Supply Chains',
    summary: 'How factories are adapting to persistent shipping delays.',
    source: 'Sample dataset',
    url: '#',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'AI Regulation',
    summary: 'Governments debate safeguards for rapidly evolving models.',
    source: 'Sample dataset',
    url: '#',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'Climate Resilience',
    summary: 'Cities invest in infrastructure upgrades ahead of storm season.',
    source: 'Sample dataset',
    url: '#',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'Elections & Policy',
    summary: 'Campaigns sharpen economic messaging heading into the fall.',
    source: 'Sample dataset',
    url: '#',
    publishedAt: new Date().toISOString(),
  },
];

const formatPublishedAt = (isoDate: string) => {
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(isoDate));
  } catch {
    return '';
  }
};

export type BubbleViewProps = {
  onSelectTopic: (topic: string) => void;
};

const BubbleView = ({ onSelectTopic }: BubbleViewProps) => {
  const { headlines, loading, error, refresh } = useHeadlines();
  const bubbleItems = (headlines.length ? headlines : SAMPLE_TOPICS).slice(0, 8);

  return (
    <section className="view bubble-view" aria-labelledby="bubble-view-heading">
      <header className="view__header">
        <div>
          <p className="eyebrow">Live sources</p>
          <h2 id="bubble-view-heading">Morning Issue Radar</h2>
        </div>
        <div className="bubble-view__status">
          <p className="view__description">
            Headlines aggregate The Guardian, NYT Top Stories, NPR, and Reuters feeds. Keyword extraction will replace these
            direct articles in Step 3.
          </p>
          <div className="bubble-view__actions">
            <button type="button" className="ghost" onClick={refresh} disabled={loading}>
              Refresh sources
            </button>
            {loading && <span className="muted" aria-live="polite">Loading…</span>}
            {error && !loading && (
              <span className="bubble-view__error" role="status">
                {error}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="bubble-view__grid" role="list">
        {bubbleItems.map((topic) => (
          <button
            key={topic.url ?? topic.title}
            type="button"
            className="bubble"
            role="listitem"
            onClick={() => onSelectTopic(topic.title)}
          >
            <span className="bubble__label">{topic.title}</span>
            <span className="bubble__summary">{topic.summary}</span>
            {topic.source && (
              <span className="bubble__source">
                {topic.source}
                {topic.publishedAt && ` · ${formatPublishedAt(topic.publishedAt)}`}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
};

export default BubbleView;
