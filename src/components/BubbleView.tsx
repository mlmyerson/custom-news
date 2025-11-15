import './BubbleView.css';

const SAMPLE_TOPICS = [
  {
    label: 'Global Supply Chains',
    summary: 'How factories are adapting to persistent shipping delays.',
  },
  {
    label: 'AI Regulation',
    summary: 'Governments debate safeguards for rapidly evolving models.',
  },
  {
    label: 'Climate Resilience',
    summary: 'Cities invest in infrastructure upgrades ahead of storm season.',
  },
  {
    label: 'Elections & Policy',
    summary: 'Campaigns sharpen economic messaging heading into the fall.',
  },
];

export type BubbleViewProps = {
  onSelectTopic: (topic: string) => void;
};

const BubbleView = ({ onSelectTopic }: BubbleViewProps) => {
  return (
    <section className="view bubble-view" aria-labelledby="bubble-view-heading">
      <header className="view__header">
        <div>
          <p className="eyebrow">Step 1 · SPA Skeleton</p>
          <h2 id="bubble-view-heading">Morning Issue Radar</h2>
        </div>
        <p className="view__description">
          This placeholder bubble map shows how topics will look once headline and keyword services are wired up.
          Select any bubble to preview the Topic View routing behavior.
        </p>
      </header>

      <div className="bubble-view__grid" role="list">
        {SAMPLE_TOPICS.map((topic) => (
          <button
            key={topic.label}
            type="button"
            className="bubble"
            role="listitem"
            onClick={() => onSelectTopic(topic.label)}
          >
            <span className="bubble__label">{topic.label}</span>
            <span className="bubble__summary">{topic.summary}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default BubbleView;
