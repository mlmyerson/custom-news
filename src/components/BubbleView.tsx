import './BubbleView.css';
import { useMemo, type CSSProperties } from 'react';
import type { UseHeadlinesResult } from '../hooks/useHeadlines';
import { extractKeywordBubbles, SAMPLE_KEYWORD_BUBBLES } from '../services/extractKeywords';
import type { KeywordBubble } from '../services/extractKeywords';

const BASE_BUBBLE_SIZE = 210;
const PANEL_COUNT = 6;

const formatMentions = (count: number) => `${count} ${count === 1 ? 'mention' : 'mentions'}`;
const clip = (value: string, length = 90) => (value.length > length ? `${value.slice(0, length).trim()}…` : value);

const toneClassForWeight = (weight: number) => {
  if (weight >= 0.85) {
    return 'bubble--tone-amber';
  }
  if (weight >= 0.65) {
    return 'bubble--tone-violet';
  }
  if (weight >= 0.45) {
    return 'bubble--tone-blue';
  }
  if (weight >= 0.25) {
    return 'bubble--tone-teal';
  }
  return 'bubble--tone-rose';
};

export type BubbleViewProps = {
  onSelectTopic: (topic: string) => void;
} & UseHeadlinesResult;

const BubbleView = ({ onSelectTopic, headlines, loading, error, refresh }: BubbleViewProps) => {
  const keywordBubbles = useMemo<KeywordBubble[]>(() => {
    if (!headlines.length) {
      return SAMPLE_KEYWORD_BUBBLES;
    }

    const extracted = extractKeywordBubbles(headlines);
    return extracted.length ? extracted : SAMPLE_KEYWORD_BUBBLES;
  }, [headlines]);

  const bubbleItems = keywordBubbles.slice(0, 24);
  const panelItems = keywordBubbles.slice(0, PANEL_COUNT);

  return (
    <section className="view bubble-view" aria-labelledby="bubble-view-heading">
      <header className="view__header">
        <div>
          <p className="eyebrow">Live sources</p>
          <h2 id="bubble-view-heading">Morning Issue Radar</h2>
        </div>
        <div className="bubble-view__status">
          <p className="view__description">
            Fetched headlines from The Guardian, NYT Top Stories, NPR, and Reuters are converted into weighted keyword
            phrases. Larger, warmer bubbles indicate phrases that appear across multiple outlets.
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
        <div className="bubble-view__grid" role="list">
          {bubbleItems.map((bubble) => {
            const size = Math.round(BASE_BUBBLE_SIZE * bubble.scale);
            return (
              <button
                key={bubble.phrase}
                type="button"
                className={`bubble ${toneClassForWeight(bubble.normalizedWeight)}`}
                role="listitem"
                style={{
                  '--bubble-size': `${size}px`,
                } as CSSProperties}
                onClick={() => onSelectTopic(bubble.label)}
              >
                <span className="bubble__label">{bubble.label}</span>
                <span className="bubble__badge">{formatMentions(bubble.mentions)}</span>
              </button>
            );
          })}
        </div>

        <aside className="pulse-panel" aria-labelledby="pulse-panel-heading">
          <div className="pulse-panel__header">
            <p className="eyebrow">Pulse details</p>
            <h3 id="pulse-panel-heading">Top phrases by overlap</h3>
            <p className="pulse-panel__description">Hover to preview a representative article, then click to explore.</p>
          </div>
          <ol className="pulse-panel__list">
            {panelItems.map((bubble, index) => (
              <li key={bubble.phrase} className="pulse-panel__item">
                <button type="button" onClick={() => onSelectTopic(bubble.label)}>
                  <span className="pulse-panel__rank">{index + 1}</span>
                  <div className="pulse-panel__content">
                    <span className="pulse-panel__label">{bubble.label}</span>
                    <span className="pulse-panel__meta">{formatMentions(bubble.mentions)}</span>
                    {bubble.sampleHeadline?.title && (
                      <span className="pulse-panel__quote">
                        “{clip(bubble.sampleHeadline.title)}” · {bubble.sampleHeadline.source}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
};

export default BubbleView;
