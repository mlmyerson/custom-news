import './BubbleView.css';
import { useMemo, type CSSProperties } from 'react';
import type { UseHeadlinesResult } from '../hooks/useHeadlines';
import type { Headline } from '../services/fetchHeadlines';
import { HEADLINE_SOURCE_NAMES } from '../services/fetchHeadlines';

// AGENT TODO let's ditch trying to size and weight the headlines for now. Just simply have a bubble for every headline we pull

const BASE_BUBBLE_SIZE = 210;
const PANEL_COUNT = 6;
const BUBBLE_LIMIT = 30;
const BUBBLE_TONES = ['bubble--tone-amber', 'bubble--tone-violet', 'bubble--tone-blue', 'bubble--tone-teal', 'bubble--tone-rose'];

const clip = (value: string, length = 90) => (value.length > length ? `${value.slice(0, length).trim()}…` : value);

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
  `Headlines from ${formatSourceList(HEADLINE_SOURCE_NAMES)} now surface 1:1 — each bubble is one live story. Click to pivot into the topic view.`;

const SOURCES_COPY = buildSourceDescription();

export type BubbleViewProps = {
  onSelectTopic: (topic: string) => void;
} & UseHeadlinesResult;

const BubbleView = ({ onSelectTopic, headlines, loading, error, refresh }: BubbleViewProps) => {
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
                className={`bubble ${toneClassForIndex(index)}`}
                role="listitem"
                style={{
                  '--bubble-size': `${BASE_BUBBLE_SIZE}px`,
                } as CSSProperties}
                onClick={() => onSelectTopic(headline.title)}
              >
                <span className="bubble__label">{clip(headline.title)}</span>
                <span className="bubble__badge">{headline.source}</span>
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
            <p className="eyebrow">Pulse details</p>
            <h3 id="pulse-panel-heading">Top phrases by overlap</h3>
            <p className="pulse-panel__description">
              {panelItems.length ? 'Click any headline to preview it inside the Topic view.' : 'Waiting for live headlines to populate this panel.'}
            </p>
          </div>
          <ol className="pulse-panel__list">
            {panelItems.length ? (
              panelItems.map((headline, index) => (
                <li key={headline.url} className="pulse-panel__item">
                  <button type="button" onClick={() => onSelectTopic(headline.title)}>
                    <span className="pulse-panel__rank">{index + 1}</span>
                    <div className="pulse-panel__content">
                      <span className="pulse-panel__label">{clip(headline.title)}</span>
                      <span className="pulse-panel__meta">
                        {headline.source}
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
        </aside>
      </div>
    </section>
  );
};

export default BubbleView;
