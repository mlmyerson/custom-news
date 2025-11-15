import type { CSSProperties } from 'react';
import './BubbleView.css';

type SampleTopic = {
  label: string;
  summary: string;
  weight: number;
  hue: number;
};

const SAMPLE_TOPICS: SampleTopic[] = [
  {
    label: 'Global Supply Chains',
    summary: 'How factories are adapting to persistent shipping delays.',
    weight: 1.15,
    hue: 40,
  },
  {
    label: 'AI Regulation',
    summary: 'Governments debate safeguards for rapidly evolving models.',
    weight: 1.4,
    hue: 285,
  },
  {
    label: 'Climate Resilience',
    summary: 'Cities invest in infrastructure upgrades ahead of storm season.',
    weight: 1.25,
    hue: 155,
  },
  {
    label: 'Elections & Policy',
    summary: 'Campaigns sharpen economic messaging heading into the fall.',
    weight: 1,
    hue: 12,
  },
  {
    label: 'Semiconductor Investment',
    summary: 'Chipmakers race to secure incentives for domestic fabs.',
    weight: 0.9,
    hue: 205,
  },
  {
    label: 'Energy Transition',
    summary: 'Debates over storage, transmission, and funding continue.',
    weight: 1.3,
    hue: 95,
  },
];

const getBubbleSize = (weight: number) => 130 + weight * 45;

const getBubbleStyle = (topic: SampleTopic, index: number): CSSProperties =>
  ({
    '--bubble-size': `${getBubbleSize(topic.weight)}px`,
    '--bubble-hue': `${topic.hue}`,
    '--bubble-delay': `${index * 0.25}s`,
  }) as CSSProperties;

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

      <div className="bubble-view__cloud" role="list">
        {SAMPLE_TOPICS.map((topic, index) => (
          <button
            key={topic.label}
            type="button"
            className="bubble"
            role="listitem"
            style={getBubbleStyle(topic, index)}
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
