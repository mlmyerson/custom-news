import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import BubbleView from './BubbleView';

describe('BubbleView', () => {
  it('renders the list of sample topics', () => {
    render(<BubbleView onSelectTopic={() => undefined} />);

    expect(screen.getByRole('heading', { name: /morning issue radar/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(4);
  });

  it('notifies when a bubble is clicked', async () => {
    const onSelectTopic = vi.fn();
    const user = userEvent.setup();

    render(<BubbleView onSelectTopic={onSelectTopic} />);

    await user.click(screen.getByRole('button', { name: /global supply chains/i }));
    expect(onSelectTopic).toHaveBeenCalledWith('Global Supply Chains');
  });
});
