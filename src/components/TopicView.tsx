import './TopicView.css';

export type TopicViewProps = {
  topic: string | null;
  onBack: () => void;
};

const TopicView = ({ topic, onBack }: TopicViewProps) => {
  return (
    <section className="view topic-view" aria-labelledby="topic-view-heading">
      <div className="topic-view__toolbar">
        <button type="button" className="ghost" onClick={onBack}>
          ← Back to bubble map
        </button>
        <p className="eyebrow">Routing preview</p>
      </div>
      <div className="topic-view__content">
        <h2 id="topic-view-heading">{topic ?? 'Pick a topic to explore'}</h2>
        <p>
          This area represents the Topic View. Once the search services are implemented, it will list aggregated articles for
          the selected phrase along with sorting and filtering controls. For now, it ensures routing and state restoration work
          as expected.
        </p>
        {!topic && <p className="muted">Use the Back button or select a bubble to populate this preview.</p>}
      </div>
    </section>
  );
};

export default TopicView;
