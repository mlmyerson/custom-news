import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TopicView from './TopicView';

const baseProps = {
  articles: [],
  loading: false,
  error: undefined,
  refresh: vi.fn(),
};

describe('TopicView', () => {
  it('renders placeholder text when no topic is selected', () => {
    render(<TopicView topic={null} onBack={() => undefined} {...baseProps} />);

    expect(screen.getByText(/pick a topic/i)).toBeInTheDocument();
    expect(screen.getByText(/use the back button/i)).toBeInTheDocument();
  });

  it('renders the selected topic and handles back clicks', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();

    render(<TopicView topic="AI Regulation" onBack={onBack} {...baseProps} loading />);

    expect(screen.getByRole('heading', { name: 'AI Regulation' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /back to tile grid/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it('lists articles with metadata when provided', () => {
    const articles = [
      {
        title: 'Breakthrough in renewable storage',
        url: 'https://example.com/article',
        source: 'Reuters',
        snippet: 'A quick summary of the article body.',
        published_at: new Date().toISOString(),
      },
    ];

    render(<TopicView topic="Climate" onBack={() => undefined} {...baseProps} articles={articles} />);

    expect(screen.getByRole('link', { name: /breakthrough in renewable storage/i })).toHaveAttribute(
      'href',
      'https://example.com/article',
    );
    expect(screen.getByText(/reuters/i)).toBeInTheDocument();
    expect(screen.getByText(/summary of the article/i)).toBeInTheDocument();
  });
});
