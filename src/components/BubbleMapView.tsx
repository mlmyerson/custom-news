import { memo } from 'react';

export type BubbleMapPhrase = {
  phrase: string;
  summary: string;
  size: number;
};

type BubbleMapViewProps = {
  phrases: BubbleMapPhrase[];
  onSelectTopic: (topic: string) => void;
};

const BubbleMapView = ({ phrases, onSelectTopic }: BubbleMapViewProps) => (
  <article className="panel" aria-labelledby="bubble-map-heading">
    <div className="panel-header">
      <div>
        <p className="panel-kicker">Bubble map</p>
        <h2 id="bubble-map-heading">Today&apos;s placeholder radar sweep</h2>
      </div>
      <p className="panel-note">This static layout will soon wire into live headline data.</p>
    </div>

    <div className="bubble-grid" role="list" aria-label="Top issue bubbles">
      {phrases.map((item) => (
        <button
          key={item.phrase}
          className="bubble-button"
          style={{ width: item.size, height: item.size }}
          onClick={() => onSelectTopic(item.phrase)}
          type="button"
          aria-label={`Open topic view for ${item.phrase}. ${item.summary}`}
        >
          <span className="bubble-label" aria-hidden="true">
            {item.phrase}
          </span>
        </button>
      ))}
    </div>
    <p className="helper-text">Tip: choose a bubble to navigate to the Topic View prototype.</p>
  </article>
);

export default memo(BubbleMapView);
