import './BubbleView.css';
import { useMemo, type CSSProperties } from 'react';
import type { UseHeadlinesResult } from '../hooks/useHeadlines';
import type { Headline } from '../services/fetchHeadlines';
import { HEADLINE_SOURCE_NAMES } from '../services/fetchHeadlines';
import { decodeEntities } from '../utils/decodeEntities';

// AGENT TODO let's ditch trying to size and weight the headlines for now. Just simply have a bubble for every headline we pull

const BASE_BUBBLE_SIZE = 210;
const PANEL_COUNT = 6;
const BUBBLE_LIMIT = 30;
const BUBBLE_TONES = ['bubble--tone-amber', 'bubble--tone-violet', 'bubble--tone-blue', 'bubble--tone-teal', 'bubble--tone-rose'];

const clip = (value: string, length = 90) => {
  const decoded = decodeEntities(value);
  return decoded.length > length ? `${decoded.slice(0, length).trim()}…` : decoded;
};

const formatSourceList = (sources: string[]) => {
  if (sources.length === 0) {
    return 'our live sources';
  }
  if (sources.length === 1) {
    return sources[0];
  }
  if (sources.length === 2) {
    return `${sources[0]} and ${sources[1]}`;
  }
  return `${sources.slice(0, -1).join(', ')}, and ${sources[sources.length - 1]}`;
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

const toneClassForIndex = (index: number) => BUBBLE_TONES[index % BUBBLE_TONES.length];

const buildSourceDescription = () =>
  `Headlines from ${formatSourceList(HEADLINE_SOURCE_NAMES)} now surface 1:1 — each bubble is one live story. Tap a bubble to preview the original article or dive into the topic view.`;

const SOURCES_COPY = buildSourceDescription();

export type BubbleViewProps = {
  onSelectHeadline: (headline: Headline) => void;
  onExploreTopic: () => void;
  selectedHeadline: Headline | null;
} & UseHeadlinesResult;

const BubbleView = ({ onSelectHeadline, onExploreTopic, selectedHeadline, headlines, loading, error, refresh }: BubbleViewProps) => {
  const visibleHeadlines = useMemo<Headline[]>(() => headlines.slice(0, BUBBLE_LIMIT), [headlines]);
  const panelItems = visibleHeadlines.slice(0, PANEL_COUNT);
  return (
    <section className="view bubble-view" aria-labelledby="bubble-view-heading">
      <header className="view__header">
        <div>
          <p className="eyebrow">Live sources</p>
          <h2 id="bubble-view-heading">Morning Issue Radar</h2>
        </div>
        <div className="bubble-view__status">
          <p className="view__description">
            {/* AGENT TODO Make the following fetch statement dynamic based on what we're linking to */}
            {SOURCES_COPY}
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
      <div className="bubble-view__body">
        <div
          className="bubble-view__grid"
          role={visibleHeadlines.length ? 'list' : undefined}
          aria-live="polite"
          data-testid="headline-bubbles"
        >
          {visibleHeadlines.length ? (
            visibleHeadlines.map((headline, index) => (
              <button
                key={headline.url}
                type="button"
                className={`bubble ${toneClassForIndex(index)} ${selectedHeadline?.url === headline.url ? 'bubble--active' : ''}`}
                role="listitem"
                style={{
                  '--bubble-size': `${BASE_BUBBLE_SIZE}px`,
                } as CSSProperties}
                onClick={() => onSelectHeadline(headline)}
              >
                <span className="bubble__label">{clip(headline.title)}</span>
                <span className="bubble__badge">{decodeEntities(headline.source)}</span>
              </button>
            ))
          ) : (
            <p className="bubble-view__empty" role="status">
              {loading ? 'Crunching live feeds…' : error ? 'Headlines unavailable. Try refreshing sources.' : 'No live headlines yet.'}
            </p>
          )}
        </div>

        <aside className="pulse-panel" aria-labelledby="pulse-panel-heading">
          <div className="pulse-panel__header">
            <p className="eyebrow">Article preview</p>
            <h3 id="pulse-panel-heading">{selectedHeadline ? 'You tapped a live headline' : 'Select a bubble to preview'}</h3>
            <p className="pulse-panel__description">
              {selectedHeadline
                ? 'Read the original reporting or jump into the aggregated topic view for deeper coverage.'
                : panelItems.length
                  ? 'Pick any bubble to see full article details without leaving the map.'
                  : 'Waiting for live headlines to populate this panel.'}
            </p>
          </div>
          {selectedHeadline ? (
            <article className="article-preview" aria-live="polite">
              <p className="article-preview__meta">
                <span>{decodeEntities(selectedHeadline.source)}</span>
                {selectedHeadline.publishedAt && <span>· {formatRelativeTime(selectedHeadline.publishedAt)}</span>}
              </p>
              <h4 className="article-preview__title">{decodeEntities(selectedHeadline.title)}</h4>
              {selectedHeadline.summary && (
                <p className="article-preview__summary">{decodeEntities(selectedHeadline.summary)}</p>
              )}
              <div className="article-preview__actions">
                <a href={selectedHeadline.url} target="_blank" rel="noreferrer" className="button button--light">
                  Read full article
                </a>
                <button type="button" className="ghost ghost--inverse" onClick={onExploreTopic}>
                  Explore related coverage
                </button>
              </div>
            </article>
          ) : (
            <ol className="pulse-panel__list">
              {panelItems.length ? (
                panelItems.map((headline, index) => (
                  <li key={headline.url} className="pulse-panel__item">
                    <button type="button" onClick={() => onSelectHeadline(headline)}>
                      <span className="pulse-panel__rank">{index + 1}</span>
                      <div className="pulse-panel__content">
                        <span className="pulse-panel__label">{clip(headline.title)}</span>
                        <span className="pulse-panel__meta">
                          {decodeEntities(headline.source)}
                          {headline.publishedAt && ` · ${formatRelativeTime(headline.publishedAt)}`}
                        </span>
                        {headline.summary && <span className="pulse-panel__quote">“{clip(headline.summary, 120)}”</span>}
                      </div>
                    </button>
                  </li>
                ))
              ) : (
                <li className="pulse-panel__empty">No headlines ready yet. Refresh the sources to populate this panel.</li>
              )}
            </ol>
          )}
        </aside>
      </div>
    </section>
  );
};

export default BubbleView;
