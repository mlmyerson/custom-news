import './TopicView.css';
import type { Article } from '../types/article';

export type TopicViewProps = {
  topic: string | null;
  onBack: () => void;
  articles: Article[];
  loading: boolean;
  error?: string;
  refresh: () => void;
};

const formatRelativeTime = (iso?: string | null) => {
  if (!iso) {
    return null;
  }

  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
};

const TopicView = ({ topic, onBack, articles, loading, error, refresh }: TopicViewProps) => {
  const showPlaceholder = !topic;
  const hasArticles = articles.length > 0;
  const showEmptyState = topic && !loading && !hasArticles && !error;

  return (
    <section className="view topic-view" aria-labelledby="topic-view-heading">
      <div className="topic-view__toolbar">
        <button type="button" className="ghost" onClick={onBack}>
          ← Back to tile grid
        </button>
        <div className="topic-view__actions">
          <p className="eyebrow">Articles</p>
          <button type="button" className="ghost" onClick={refresh} disabled={!topic || loading}>
            Refresh coverage
          </button>
        </div>
      </div>
      <div className="topic-view__content">
        <h2 id="topic-view-heading">{topic ?? 'Pick a topic to explore'}</h2>
        {showPlaceholder ? (
          <p className="muted">Use the Back button or pick a tile to populate this panel with live articles.</p>
        ) : (
          <>
            <p className="topic-view__summary" role="status" aria-live="polite">
              {loading && 'Gathering fresh coverage…'}
              {!loading && hasArticles && `${articles.length} articles from multi-source search`}
              {!loading && error && 'Unable to fetch articles right now.'}
              {!loading && showEmptyState && 'No matching coverage yet. Try refining the topic or refreshing.'}
            </p>
            {error && !loading && <p className="topic-view__error">{error}</p>}
            {hasArticles && (
              <ol className="topic-view__list">
                {articles.map((article) => {
                  const relativeTime = formatRelativeTime(article.published_at ?? undefined);

                  return (
                    <li key={article.url} className="topic-view__list-item">
                      <article>
                        <p className="topic-view__article-meta">
                          <span>{article.source}</span>
                          {relativeTime && <span>· {relativeTime}</span>}
                        </p>
                        <h3>
                          <a href={article.url} target="_blank" rel="noreferrer">
                            {article.title}
                          </a>
                        </h3>
                        {article.snippet && <p className="topic-view__article-snippet">{article.snippet}</p>}
                      </article>
                    </li>
                  );
                })}
              </ol>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default TopicView;
