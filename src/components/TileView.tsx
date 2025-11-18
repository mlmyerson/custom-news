import './TileView.css';
import { useMemo, useEffect, useState, type CSSProperties } from 'react';
import type { UseHeadlinesResult } from '../hooks/useHeadlines';
import type { Headline } from '../services/fetchHeadlines';
import { HEADLINE_SOURCE_NAMES } from '../services/fetchHeadlines';
import { generateMosaic, loadTilingRules, calculateTileDimensions } from '../services/tilingEngine';
import type { PlacedTile } from '../types/tile';

const PANEL_COUNT = 6;
const TILE_LIMIT = 30;
const TILE_TONES = ['tile--tone-amber', 'tile--tone-violet', 'tile--tone-blue', 'tile--tone-teal', 'tile--tone-rose'];

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

const toneClassForIndex = (index: number) => TILE_TONES[index % TILE_TONES.length];

const buildSourceDescription = () =>
  `Headlines from ${formatSourceList(HEADLINE_SOURCE_NAMES)} now appear as tiles in a mosaic layout — each tile is one live story. Tap a tile to preview the original article or dive into the topic view.`;

const SOURCES_COPY = buildSourceDescription();

export type TileViewProps = {
  onSelectHeadline: (headline: Headline) => void;
  onExploreTopic: () => void;
  selectedHeadline: Headline | null;
} & UseHeadlinesResult;

const TileView = ({ onSelectHeadline, onExploreTopic, selectedHeadline, headlines, loading, error, refresh }: TileViewProps) => {
  const [containerWidth, setContainerWidth] = useState<number>(400);
  const visibleHeadlines = useMemo<Headline[]>(() => headlines.slice(0, TILE_LIMIT), [headlines]);
  const panelItems = visibleHeadlines.slice(0, PANEL_COUNT);
  
  const tilingRules = useMemo(() => loadTilingRules(), []);
  
  // Determine columns based on container width
  const columns = useMemo(() => {
    if (containerWidth < 640) return tilingRules.gridConfig.mobileColumns;
    if (containerWidth < 1024) return tilingRules.gridConfig.tabletColumns;
    return tilingRules.gridConfig.desktopColumns;
  }, [containerWidth, tilingRules]);
  
  const mosaic = useMemo(() => {
    return generateMosaic(visibleHeadlines.length, columns);
  }, [visibleHeadlines.length, columns]);
  
  // Measure container width
  useEffect(() => {
    const measureWidth = () => {
      const container = document.querySelector('.tile-view__mosaic');
      if (container) {
        setContainerWidth(container.clientWidth);
      }
    };
    
    measureWidth();
    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
  }, []);

  return (
    <section className="view tile-view" aria-labelledby="tile-view-heading">
      <header className="view__header">
        <div>
          <p className="eyebrow">Live sources</p>
          <h2 id="tile-view-heading">Morning Issue Mosaic</h2>
        </div>
        <div className="tile-view__status">
          <p className="view__description">
            {SOURCES_COPY}
          </p>
          <div className="tile-view__actions">
            <button type="button" className="ghost" onClick={refresh} disabled={loading}>
              Refresh mosaic
            </button>
            {loading && <span className="muted" aria-live="polite">Loading…</span>}
            {error && !loading && (
              <span className="tile-view__error" role="status">
                {error}
              </span>
            )}
          </div>
        </div>
      </header>
      <div className="tile-view__body">
        <div
          className="tile-view__mosaic"
          role={visibleHeadlines.length ? 'list' : undefined}
          aria-live="polite"
          data-testid="headline-tiles"
        >
          {visibleHeadlines.length ? (
            mosaic.tiles.map((tile: PlacedTile) => {
              const headline = visibleHeadlines[tile.articleIndex];
              if (!headline) return null;
              
              const dimensions = calculateTileDimensions(tile.shape, tilingRules, columns, containerWidth);
              
              return (
                <button
                  key={headline.url}
                  type="button"
                  className={`tile ${toneClassForIndex(tile.articleIndex)} ${selectedHeadline?.url === headline.url ? 'tile--active' : ''}`}
                  role="listitem"
                  style={{
                    '--tile-width': `${dimensions.width}px`,
                    '--tile-height': `${dimensions.height}px`,
                    '--tile-row': tile.position.row,
                    '--tile-col': tile.position.col,
                    gridColumn: `${tile.position.col + 1} / span ${tile.shape.width}`,
                    gridRow: `${tile.position.row + 1} / span ${tile.shape.height}`,
                  } as CSSProperties}
                  onClick={() => onSelectHeadline(headline)}
                >
                  <span className="tile__label">{clip(headline.title)}</span>
                  <span className="tile__badge">{headline.source}</span>
                </button>
              );
            })
          ) : (
            <p className="tile-view__empty" role="status">
              {loading ? 'Generating mosaic…' : error ? 'Headlines unavailable. Try refreshing sources.' : 'No live headlines yet.'}
            </p>
          )}
        </div>

        <aside className="pulse-panel" aria-labelledby="pulse-panel-heading">
          <div className="pulse-panel__header">
            <p className="eyebrow">Article preview</p>
            <h3 id="pulse-panel-heading">{selectedHeadline ? 'You tapped a live headline' : 'Select a tile to preview'}</h3>
            <p className="pulse-panel__description">
              {selectedHeadline
                ? 'Read the original reporting or jump into the aggregated topic view for deeper coverage.'
                : panelItems.length
                  ? 'Pick any tile to see full article details without leaving the mosaic.'
                  : 'Waiting for live headlines to populate this panel.'}
            </p>
          </div>
          {selectedHeadline ? (
            <article className="article-preview" aria-live="polite">
              <p className="article-preview__meta">
                <span>{selectedHeadline.source}</span>
                {selectedHeadline.publishedAt && <span>· {formatRelativeTime(selectedHeadline.publishedAt)}</span>}
              </p>
              <h4 className="article-preview__title">{selectedHeadline.title}</h4>
              {selectedHeadline.summary && <p className="article-preview__summary">{selectedHeadline.summary}</p>}
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
                          {headline.source}
                          {headline.publishedAt && ` · ${formatRelativeTime(headline.publishedAt)}`}
                        </span>
                        {headline.summary && <span className="pulse-panel__quote">"{clip(headline.summary, 120)}"</span>}
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

export default TileView;
