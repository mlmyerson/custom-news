import './ArticleDetailView.css';
import type { Headline } from '../services/fetchHeadlines';

export type ArticleDetailViewProps = {
  article: Headline | null;
  onBack: () => void;
};

const formatRelativeTime = (iso?: string) => {
  if (!iso) {
    return '';
  }

  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) {
    return '';
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

const ArticleDetailView = ({ article, onBack }: ArticleDetailViewProps) => {
  if (!article) {
    return (
      <section className="view article-detail-view" aria-labelledby="article-detail-heading">
        <div className="article-detail-view__toolbar">
          <button type="button" className="ghost" onClick={onBack}>
            ← Back to tile grid
          </button>
        </div>
        <div className="article-detail-view__content">
          <h2 id="article-detail-heading">No article selected</h2>
          <p className="muted">Use the Back button or pick a tile to view article details.</p>
        </div>
      </section>
    );
  }

  const relativeTime = formatRelativeTime(article.publishedAt);

  return (
    <section className="view article-detail-view" aria-labelledby="article-detail-heading">
      <div className="article-detail-view__toolbar">
        <button type="button" className="ghost" onClick={onBack}>
          ← Back to tile grid
        </button>
      </div>
      <div className="article-detail-view__content">
        <article className="article-detail">
          <div className="article-detail__header">
            <p className="eyebrow">Article Details</p>
            <div className="article-detail__meta">
              <span className="article-detail__source">{article.source}</span>
              {relativeTime && <span className="article-detail__time">· {relativeTime}</span>}
            </div>
          </div>
          
          <h2 id="article-detail-heading" className="article-detail__title">
            {article.title}
          </h2>
          
          {article.summary && (
            <div className="article-detail__summary">
              <h3 className="article-detail__summary-heading">Summary</h3>
              <p>{article.summary}</p>
            </div>
          )}
          
          <div className="article-detail__info">
            <h3 className="article-detail__info-heading">Source Information</h3>
            <dl className="article-detail__info-list">
              <div className="article-detail__info-item">
                <dt>Publisher</dt>
                <dd>{article.source}</dd>
              </div>
              <div className="article-detail__info-item">
                <dt>Published</dt>
                <dd>{relativeTime || 'Unknown'}</dd>
              </div>
              <div className="article-detail__info-item">
                <dt>Article URL</dt>
                <dd className="article-detail__url">
                  <a href={article.url} target="_blank" rel="noreferrer">
                    {article.url}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
          
          <div className="article-detail__actions">
            <a 
              href={article.url} 
              target="_blank" 
              rel="noreferrer" 
              className="button button--primary"
            >
              Read Full Article →
            </a>
            <a 
              href={`https://www.google.com/search?q=${encodeURIComponent(article.title)}`}
              target="_blank" 
              rel="noreferrer" 
              className="button button--secondary"
            >
              Explore Related Coverage
            </a>
          </div>
        </article>
      </div>
    </section>
  );
};

export default ArticleDetailView;
