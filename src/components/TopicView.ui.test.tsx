import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TopicView from './TopicView';

describe('TopicView', () => {
  it('renders placeholder text when no topic is selected', () => {
    render(<TopicView topic={null} onBack={() => undefined} />);

    expect(screen.getByText(/pick a topic/i)).toBeInTheDocument();
    expect(screen.getByText(/use the back button/i)).toBeInTheDocument();
  });

  it('renders the selected topic and handles back clicks', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();

    render(<TopicView topic="AI Regulation" onBack={onBack} />);

    expect(screen.getByRole('heading', { name: 'AI Regulation' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /back to bubble map/i }));
    expect(onBack).toHaveBeenCalled();
  });
});
