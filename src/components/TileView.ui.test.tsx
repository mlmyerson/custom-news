import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import TileView from './TileView';
import type { Headline } from '../services/fetchHeadlines';

const mockHeadlines: Headline[] = [
  {
    title: 'Breaking: Major Tech Announcement',
    url: 'https://example.com/article-1',
    source: 'TechNews',
    summary: 'A groundbreaking development in technology.',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    title: 'Political Update: New Policy Introduced',
    url: 'https://example.com/article-2',
    source: 'NewsSource',
    summary: 'Government announces new policy changes.',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    title: 'Sports: Championship Finals Tonight',
    url: 'https://example.com/article-3',
    source: 'SportsDaily',
    summary: 'The big game everyone has been waiting for.',
    publishedAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

describe('TileView', () => {
  const mockOnSelectHeadline = vi.fn();
  const mockOnExploreTopic = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    mockOnSelectHeadline.mockClear();
    mockOnExploreTopic.mockClear();
    mockRefresh.mockClear();
  });

  it('renders the mosaic heading', () => {
    render(
      <TileView
        headlines={mockHeadlines}
        loading={false}
        error={undefined}
        lastUpdated={undefined}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={null}
      />
    );

    expect(screen.getByRole('heading', { name: /Morning Issue Mosaic/i })).toBeInTheDocument();
  });

  it('renders tiles for each headline', () => {
    render(
      <TileView
        headlines={mockHeadlines}
        loading={false}
        error={undefined}
        lastUpdated={undefined}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={null}
      />
    );

    const tiles = screen.getByTestId('headline-tiles');
    const tileButtons = within(tiles).getAllByRole('listitem');

    expect(tileButtons).toHaveLength(mockHeadlines.length);
  });

  it('displays headline titles in tiles', () => {
    render(
      <TileView
        headlines={mockHeadlines}
        loading={false}
        error={undefined}
        lastUpdated={undefined}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={null}
      />
    );

    const tiles = screen.getByTestId('headline-tiles');
    expect(within(tiles).getByText(mockHeadlines[0].title)).toBeInTheDocument();
    expect(within(tiles).getByText(mockHeadlines[1].title)).toBeInTheDocument();
    expect(within(tiles).getByText(mockHeadlines[2].title)).toBeInTheDocument();
  });

  it('displays source badges on tiles', () => {
    render(
      <TileView
        headlines={mockHeadlines}
        loading={false}
        error={undefined}
        lastUpdated={undefined}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={null}
      />
    );

    const tiles = screen.getByTestId('headline-tiles');
    expect(within(tiles).getByText('TechNews')).toBeInTheDocument();
    expect(within(tiles).getByText('NewsSource')).toBeInTheDocument();
    expect(within(tiles).getByText('SportsDaily')).toBeInTheDocument();
  });

  it('calls onSelectHeadline when a tile is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TileView
        headlines={mockHeadlines}
        loading={false}
        error={undefined}
        lastUpdated={undefined}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={null}
      />
    );

    const tiles = screen.getByTestId('headline-tiles');
    const firstTile = within(tiles).getAllByRole('listitem')[0];

    await user.click(firstTile);

    expect(mockOnSelectHeadline).toHaveBeenCalledWith(mockHeadlines[0]);
  });

  it('highlights the selected tile', () => {
    render(
      <TileView
        headlines={mockHeadlines}
        loading={false}
        error={undefined}
        lastUpdated={undefined}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={mockHeadlines[0]}
      />
    );

    const tiles = screen.getByTestId('headline-tiles');
    const firstTile = within(tiles).getAllByRole('listitem')[0];

    expect(firstTile).toHaveClass('tile--active');
  });

  it('shows loading state', () => {
    render(
      <TileView
        headlines={[]}
        loading={true}
        error={undefined}
        lastUpdated={undefined}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={null}
      />
    );

    expect(screen.getByText(/Generating mosaic…/i)).toBeInTheDocument();
    expect(screen.getByText(/Loading…/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(
      <TileView
        headlines={[]}
        loading={false}
        error="Failed to fetch headlines"
        lastUpdated={undefined}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={null}
      />
    );

    expect(screen.getByText(/Headlines unavailable/i)).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch headlines')).toBeInTheDocument();
  });

  it('shows empty state when no headlines', () => {
    render(
      <TileView
        headlines={[]}
        loading={false}
        error={undefined}
        lastUpdated={undefined}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={null}
      />
    );

    expect(screen.getByText(/No live headlines yet/i)).toBeInTheDocument();
  });

  it('calls refresh when refresh button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TileView
        headlines={mockHeadlines}
        loading={false}
        error={undefined}
        lastUpdated={undefined}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={null}
      />
    );

    const refreshButton = screen.getByRole('button', { name: /Refresh mosaic/i });
    await user.click(refreshButton);

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('disables refresh button when loading', () => {
    render(
      <TileView
        headlines={mockHeadlines}
        loading={true}
        error={undefined}
        lastUpdated={undefined}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={null}
      />
    );

    const refreshButton = screen.getByRole('button', { name: /Refresh mosaic/i });
    expect(refreshButton).toBeDisabled();
  });

  it('shows all articles in the articles panel', () => {
    render(
      <TileView
        headlines={mockHeadlines}
        loading={false}
        error={undefined}
        lastUpdated={undefined}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={null}
      />
    );

    // Check panel shows "Articles" heading
    expect(screen.getByText('Articles')).toBeInTheDocument();
    expect(screen.getByText(/All articles we've pulled/)).toBeInTheDocument();
    
    // All articles should be visible - they appear in both tiles and list
    expect(screen.getAllByText(mockHeadlines[0].title).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(mockHeadlines[1].title).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(mockHeadlines[2].title).length).toBeGreaterThanOrEqual(1);
  });

  it('shows link to read full article for each article', () => {
    render(
      <TileView
        headlines={mockHeadlines}
        loading={false}
        error={undefined}
        lastUpdated={undefined}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={null}
      />
    );

    const links = screen.getAllByRole('link', { name: /Read full article/i });
    expect(links).toHaveLength(mockHeadlines.length);
    expect(links[0]).toHaveAttribute('href', mockHeadlines[0].url);
    expect(links[0]).toHaveAttribute('target', '_blank');
  });

  it('calls onExploreTopic when explore button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TileView
        headlines={mockHeadlines}
        loading={false}
        error={undefined}
        lastUpdated={undefined}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={null}
      />
    );

    const exploreButtons = screen.getAllByRole('button', { name: /Explore related coverage/i });
    await user.click(exploreButtons[0]);

    expect(mockOnSelectHeadline).toHaveBeenCalledWith(mockHeadlines[0]);
    expect(mockOnExploreTopic).toHaveBeenCalledTimes(1);
  });

  it('shows articles list with all articles', () => {
    render(
      <TileView
        headlines={mockHeadlines}
        loading={false}
        error={undefined}
        lastUpdated={undefined}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={null}
      />
    );

    // Both tiles and articles should be in lists
    const allLists = screen.getAllByRole('list');
    expect(allLists.length).toBe(2);
    
    // Check that articles list has all items
    const articlesList = allLists[1]; // Second list is the articles list
    const articleItems = within(articlesList).getAllByRole('listitem');
    expect(articleItems.length).toBe(mockHeadlines.length);
  });

  it('limits tiles to TILE_LIMIT', () => {
    const manyHeadlines: Headline[] = Array.from({ length: 50 }, (_, i) => ({
      title: `Headline ${i + 1}`,
      url: `https://example.com/article-${i + 1}`,
      source: 'Source',
      summary: 'Summary',
      publishedAt: new Date().toISOString(),
    }));

    render(
      <TileView
        headlines={manyHeadlines}
        loading={false}
        error={undefined}
        lastUpdated={undefined}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={null}
      />
    );

    const tiles = screen.getByTestId('headline-tiles');
    const tileButtons = within(tiles).getAllByRole('listitem');

    // Should be limited to 30 tiles
    expect(tileButtons).toHaveLength(30);
  });
});
