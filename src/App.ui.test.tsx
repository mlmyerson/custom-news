import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

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

const buildHeadlinesState = () => ({
  headlines: sampleHeadlines,
  loading: false,
  error: undefined,
  refresh: vi.fn(),
  lastUpdated: new Date().toISOString(),
});

const buildArticleSearchState = () => ({
  articles: [],
  loading: false,
  error: undefined,
  refresh: vi.fn(),
});

const mockUseHeadlines = vi.fn(buildHeadlinesState);
const mockUseArticleSearch = vi.fn(buildArticleSearchState);

vi.mock('./hooks/useHeadlines', () => ({
  useHeadlines: () => mockUseHeadlines(),
}));

vi.mock('./hooks/useArticleSearch', () => ({
  useArticleSearch: () => mockUseArticleSearch(),
}));

describe('App integration view', () => {

  beforeEach(() => {
    mockUseHeadlines.mockImplementation(buildHeadlinesState);
    mockUseArticleSearch.mockImplementation(buildArticleSearchState);
    window.location.hash = '#tile';
  });

  afterEach(() => {
    vi.clearAllMocks();
    window.location.hash = '#tile';
  });

  it('navigates to the article detail view when a tile is selected', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { name: /morning issue mosaic/i });
    expect(window.location.hash).toBe('#tile');

    const tiles = await screen.findByTestId('headline-tiles');
    const tileButtons = within(tiles).getAllByRole('listitem');
    await user.click(tileButtons[0]);

    expect(await screen.findByRole('heading', { name: sampleHeadlines[0].title })).toBeInTheDocument();
    expect(window.location.hash).toBe('#article');

    const readLink = screen.getByRole('link', { name: /read full article/i });
    expect(readLink).toHaveAttribute('href', sampleHeadlines[0].url);

    const exploreLink = screen.getByRole('link', { name: /explore related coverage/i });
    const expectedUrl = `https://www.google.com/search?q=${encodeURIComponent(sampleHeadlines[0].title)}`;
    expect(exploreLink).toHaveAttribute('href', expectedUrl);
  });

  it('keeps the explore link wired to Google search from article detail', async () => {
    const user = userEvent.setup();
    render(<App />);

    const tiles = await screen.findByTestId('headline-tiles');
    const tileButtons = within(tiles).getAllByRole('listitem');
    await user.click(tileButtons[0]);

    const exploreLink = await screen.findByRole('link', { name: /explore related coverage/i });
    const expectedUrl = `https://www.google.com/search?q=${encodeURIComponent(sampleHeadlines[0].title)}`;
    expect(exploreLink).toHaveAttribute('href', expectedUrl);
    expect(exploreLink).toHaveAttribute('target', '_blank');
    expect(exploreLink).toHaveAttribute('rel', 'noreferrer');
  });

  it('returns to the tile view when the back button is used from article detail', async () => {
    const user = userEvent.setup();
    render(<App />);

    const tiles = await screen.findByTestId('headline-tiles');
    const tileButtons = within(tiles).getAllByRole('listitem');
    await user.click(tileButtons[0]);

    await user.click(await screen.findByRole('button', { name: /back to tile grid/i }));

    expect(window.location.hash).toBe('#tile');
    expect(await screen.findByTestId('headline-tiles')).toBeInTheDocument();
  });
});
