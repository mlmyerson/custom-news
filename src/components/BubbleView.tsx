import './BubbleView.css';
import { useMemo, type CSSProperties } from 'react';
import { useHeadlines } from '../hooks/useHeadlines';
import { extractKeywordBubbles, SAMPLE_KEYWORD_BUBBLES } from '../services/extractKeywords';
import type { KeywordBubble } from '../services/extractKeywords';

const BASE_BUBBLE_SIZE = 180;

const formatMentions = (count: number) => `${count} ${count === 1 ? 'mention' : 'mentions'}`;

export type BubbleViewProps = {
  onSelectTopic: (topic: string) => void;
};

const BubbleView = ({ onSelectTopic }: BubbleViewProps) => {
  const { headlines, loading, error, refresh } = useHeadlines();
  const keywordBubbles = useMemo<KeywordBubble[]>(() => {
    if (!headlines.length) {
      return SAMPLE_KEYWORD_BUBBLES;
    }

    const extracted = extractKeywordBubbles(headlines);
    return extracted.length ? extracted : SAMPLE_KEYWORD_BUBBLES;
  }, [headlines]);

  const bubbleItems = keywordBubbles.slice(0, 24);

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

      <div className="bubble-view__grid" role="list">
        {bubbleItems.map((bubble) => {
          const size = Math.round(BASE_BUBBLE_SIZE * bubble.scale);
          return (
            <button
              key={bubble.phrase}
              type="button"
              className="bubble"
              role="listitem"
              style={{
                '--bubble-size': `${size}px`,
                '--bubble-color-start': bubble.colors.start,
                '--bubble-color-end': bubble.colors.end,
              } as CSSProperties}
              onClick={() => onSelectTopic(bubble.label)}
            >
              <span className="bubble__label">{bubble.label}</span>
              <span className="bubble__metric">{formatMentions(bubble.mentions)}</span>
              {bubble.sampleHeadline && (
                <span className="bubble__source">
                  {bubble.sampleHeadline.source}
                  {bubble.sampleHeadline.publishedAt &&
                    ` · ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
                      new Date(bubble.sampleHeadline.publishedAt),
                    )}`}
                </span>
              )}
              {bubble.sampleHeadline?.title && (
                <span className="bubble__context" aria-hidden="true">
                  “{bubble.sampleHeadline.title}”
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default BubbleView;
