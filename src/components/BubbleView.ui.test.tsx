import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import BubbleView from './BubbleView';

const sampleHeadlines = [
  {
    title: 'Farmers brace for season&rsquo;s second mega-storm',
    summary: 'Officials accelerate seawall &amp; grid hardening projects ahead of storm season.',
    source: 'NPR',
    url: 'https://example.com/npr-infrastructure',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'Regulators outline new AI guardrails &amp; resilience tests for frontier labs',
    summary: 'Global agencies sketch synchronized safety rules.',
    source: 'Reuters',
    url: 'https://example.com/reuters-ai',
    publishedAt: new Date().toISOString(),
  },
];

const baseHeadlinesState = {
  headlines: sampleHeadlines,
  loading: false,
  error: undefined,
  lastUpdated: undefined,
  refresh: vi.fn(),
};

const defaultProps = {
  ...baseHeadlinesState,
  onSelectHeadline: vi.fn(),
  selectedHeadline: null,
};

describe('BubbleView', () => {
  it('renders a bubble for every available headline', () => {
    render(<BubbleView {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /morning issue radar/i })).toBeInTheDocument();
    const bubbleGrid = screen.getByTestId('headline-bubbles');
    expect(within(bubbleGrid).getAllByRole('listitem')).toHaveLength(sampleHeadlines.length);
  });

  it('shows an empty state when no headlines are available', () => {
    render(<BubbleView {...defaultProps} headlines={[]} />);

    expect(screen.getByText(/no live headlines/i)).toBeInTheDocument();
  });

  it('decodes headline and summary entities before rendering', () => {
    render(<BubbleView {...defaultProps} />);

    expect(screen.getByRole('button', { name: /season’s second mega-storm/i })).toBeInTheDocument();
    expect(screen.getByText(/seawall & grid hardening/i)).toBeInTheDocument();
  });

  it('notifies when a bubble is clicked and surfaces preview actions', async () => {
    const onSelectHeadline = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <BubbleView {...defaultProps} onSelectHeadline={onSelectHeadline} />,
    );

    await user.click(screen.getByRole('button', { name: /farmers brace/i }));
    expect(onSelectHeadline).toHaveBeenCalledWith(sampleHeadlines[0]);

    rerender(
      <BubbleView
        {...defaultProps}
        selectedHeadline={sampleHeadlines[0]}
        onSelectHeadline={onSelectHeadline}
      />,
    );

    expect(screen.getByText(/read full article/i)).toBeInTheDocument();

    // Verify the "Explore Related Coverage" link exists and points to Google search
    const exploreLink = screen.getByRole('link', { name: /explore related coverage/i });
    expect(exploreLink).toBeInTheDocument();
    const expectedUrl = `https://www.google.com/search?q=${encodeURIComponent(sampleHeadlines[0].title)}`;
    expect(exploreLink).toHaveAttribute('href', expectedUrl);
    expect(exploreLink).toHaveAttribute('target', '_blank');
    expect(exploreLink).toHaveAttribute('rel', 'noreferrer');
  });
});
