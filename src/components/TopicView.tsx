import { memo, useEffect, useRef } from 'react';

type TopicViewProps = {
  topic: string;
  onBack: () => void;
};

const TopicView = ({ topic, onBack }: TopicViewProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [topic]);

  return (
    <article className="panel topic-panel" aria-labelledby="topic-view-heading">
      <button className="ghost-button" onClick={onBack}>
        ← Back to bubble map
      </button>
      <p className="panel-kicker">Topic view prototype</p>
      <h2 id="topic-view-heading" tabIndex={-1} ref={headingRef}>
        {topic}
      </h2>
      <p>
        This placeholder topic view confirms the internal router works. In later steps we&apos;ll hydrate this space with
        cross-source article results, filters, and summaries.
      </p>
      <div className="topic-placeholder" role="status" aria-live="polite">
        <p>Article list incoming…</p>
      </div>
    </article>
  );
};

export default memo(TopicView);
