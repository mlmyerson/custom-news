import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import * as headlinesService from './services/fetchHeadlines';

const sampleHeadlines = [
  {
    title: 'Test headline alpha',
    summary: 'A sample summary for integration testing.',
    source: 'NPR',
    url: 'https://example.com/alpha',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'Test headline beta',
    summary: 'Second story summary for integration testing.',
    source: 'Reuters',
    url: 'https://example.com/beta',
    publishedAt: new Date().toISOString(),
  },
];

describe('App integration view', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.spyOn(headlinesService, 'fetchHeadlines').mockResolvedValue(sampleHeadlines);
    window.location.hash = '#tile';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.location.hash = '#tile';
  });

  it('renders the tile mosaic by default and navigates to topic view from preview', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /see the issues every outlet repeats today/i })).toBeInTheDocument();

    // Find tile button that contains the headline text
    const tiles = await screen.findByTestId('headline-tiles');
    const tileButtons = within(tiles).getAllByRole('listitem');
    await user.click(tileButtons[0]);

    // All articles should have "Read full article" links
    expect(screen.getAllByText(/read full article/i).length).toBeGreaterThan(0);
    expect(window.location.hash).toBe('#tile');

    // Click the first "Explore related coverage" button
    const exploreButtons = screen.getAllByRole('button', { name: /explore related coverage/i });
    await user.click(exploreButtons[0]);

    expect(screen.getByRole('heading', { name: sampleHeadlines[0].title })).toBeInTheDocument();
    expect(window.location.hash).toBe('#topic');
  });
});
