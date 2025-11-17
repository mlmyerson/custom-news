import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import BubbleView from './BubbleView';

const baseHeadlinesState = {
  headlines: [],
  loading: false,
  error: undefined,
  lastUpdated: undefined,
  refresh: vi.fn(),
};

describe('BubbleView', () => {
  it('renders the list of sample topics', () => {
    render(<BubbleView onSelectTopic={() => undefined} {...baseHeadlinesState} />);

    expect(screen.getByRole('heading', { name: /morning issue radar/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(4);
  });

  it('notifies when a bubble is clicked', async () => {
    const onSelectTopic = vi.fn();
    const user = userEvent.setup();

    render(<BubbleView onSelectTopic={onSelectTopic} {...baseHeadlinesState} />);

    await user.click(screen.getByRole('button', { name: /ai regulation/i }));
    expect(onSelectTopic).toHaveBeenCalledWith('AI Regulation');
  });
});
