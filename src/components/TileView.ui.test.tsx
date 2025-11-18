import { render, screen, within, waitFor } from '@testing-library/react';
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
        error={null}
        lastUpdated={null}
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
        error={null}
        lastUpdated={null}
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
        error={null}
        lastUpdated={null}
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
        error={null}
        lastUpdated={null}
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
        error={null}
        lastUpdated={null}
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
        error={null}
        lastUpdated={null}
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
        error={null}
        lastUpdated={null}
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
        lastUpdated={null}
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
        error={null}
        lastUpdated={null}
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
        error={null}
        lastUpdated={null}
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
        error={null}
        lastUpdated={null}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={null}
      />
    );

    const refreshButton = screen.getByRole('button', { name: /Refresh mosaic/i });
    expect(refreshButton).toBeDisabled();
  });

  it('shows article preview when headline is selected', () => {
    render(
      <TileView
        headlines={mockHeadlines}
        loading={false}
        error={null}
        lastUpdated={null}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={mockHeadlines[0]}
      />
    );

    // Check preview panel shows selected headline
    const previewSection = screen.getByRole('article', { name: undefined });
    expect(within(previewSection).getByText(mockHeadlines[0].title)).toBeInTheDocument();
    expect(within(previewSection).getByText(mockHeadlines[0].summary!)).toBeInTheDocument();
  });

  it('shows link to read full article', () => {
    render(
      <TileView
        headlines={mockHeadlines}
        loading={false}
        error={null}
        lastUpdated={null}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={mockHeadlines[0]}
      />
    );

    const link = screen.getByRole('link', { name: /Read full article/i });
    expect(link).toHaveAttribute('href', mockHeadlines[0].url);
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('calls onExploreTopic when explore button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TileView
        headlines={mockHeadlines}
        loading={false}
        error={null}
        lastUpdated={null}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={mockHeadlines[0]}
      />
    );

    const exploreButton = screen.getByRole('button', { name: /Explore related coverage/i });
    await user.click(exploreButton);

    expect(mockOnExploreTopic).toHaveBeenCalledTimes(1);
  });

  it('shows preview list when no headline is selected', () => {
    render(
      <TileView
        headlines={mockHeadlines}
        loading={false}
        error={null}
        lastUpdated={null}
        refresh={mockRefresh}
        onSelectHeadline={mockOnSelectHeadline}
        onExploreTopic={mockOnExploreTopic}
        selectedHeadline={null}
      />
    );

    // First 6 headlines should be in preview list
    const previewLists = screen.getAllByRole('list');
    // One is the tile list, one is the preview list
    expect(previewLists.length).toBe(2);
    
    // Check that preview list has items
    const previewList = previewLists[1]; // Second list is the preview list
    const previewItems = within(previewList).getAllByRole('listitem');
    expect(previewItems.length).toBeGreaterThan(0);
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
        error={null}
        lastUpdated={null}
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
