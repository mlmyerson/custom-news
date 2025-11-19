import { act, render, screen, within } from '@testing-library/react';
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

  it('renders the tile mosaic by default and keeps the user on #tile when a tile is selected', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /see the issues every outlet repeats today/i })).toBeInTheDocument();
    expect(window.location.hash).toBe('#tile');

    const tiles = await screen.findByTestId('headline-tiles');
    const tileButtons = within(tiles).getAllByRole('listitem');
    await user.click(tileButtons[0]);

    expect(screen.getAllByText(/read full article/i).length).toBeGreaterThan(0);
    expect(window.location.hash).toBe('#tile');
  });

  it('opens a Google search when Explore Related Coverage is clicked from the tile preview', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<App />);

    const tiles = await screen.findByTestId('headline-tiles');
    const tileButtons = within(tiles).getAllByRole('listitem');
    await user.click(tileButtons[0]);

    const exploreButtons = screen.getAllByRole('button', { name: /explore related coverage/i });
    await user.click(exploreButtons[0]);

    const expectedUrl = new URL('https://www.google.com/search');
    expectedUrl.searchParams.set('q', sampleHeadlines[0].title);
    expect(openSpy).toHaveBeenCalledWith(expectedUrl.toString(), '_blank', 'noopener,noreferrer');
    openSpy.mockRestore();
  });

  it('links to Google search when viewing the article detail route', async () => {
    render(<App />);

    const tiles = await screen.findByTestId('headline-tiles');
    const tileButtons = within(tiles).getAllByRole('listitem');
    await user.click(tileButtons[0]);

    act(() => {
      window.location.hash = '#article';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    const exploreLink = await screen.findByRole('link', { name: /explore related coverage/i });
    const expectedUrl = `https://www.google.com/search?q=${encodeURIComponent(sampleHeadlines[0].title)}`;
    expect(exploreLink).toHaveAttribute('href', expectedUrl);
    expect(exploreLink).toHaveAttribute('target', '_blank');
    expect(exploreLink).toHaveAttribute('rel', 'noreferrer');
  });
});
