import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import * as headlinesService from './services/fetchHeadlines';
import * as newsSourcesModule from '../modules/newsSources';

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
    window.location.hash = '#bubble';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.location.hash = '#bubble';
  });

  it('renders the bubble map by default and navigates to article detail view on bubble click', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /see the issues every outlet repeats today/i })).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: /test headline alpha/i }));

    expect(screen.getByRole('heading', { name: sampleHeadlines[0].title })).toBeInTheDocument();
    expect(screen.getByText(/article details/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /read full article/i })).toBeInTheDocument();
    expect(window.location.hash).toBe('#article');
  });

  it('searches for related articles when "Explore Related Coverage" is clicked from bubble preview', async () => {
    const mockSearchResults = [
      {
        title: 'Related article about Test headline alpha',
        url: 'https://example.com/related-1',
        source: 'The Guardian',
        snippet: 'This article provides more context on the topic.',
        published_at: new Date().toISOString(),
      },
      {
        title: 'Another related article on the same topic',
        url: 'https://example.com/related-2',
        source: 'BBC',
        snippet: 'Additional coverage from a different perspective.',
        published_at: new Date().toISOString(),
      },
    ];

    // Mock the searchAllSources function to return related articles
    vi.spyOn(newsSourcesModule, 'searchAllSources').mockResolvedValue(mockSearchResults);

    render(<App />);

    // Wait for headlines to load and click on the first bubble
    await user.click(await screen.findByRole('button', { name: /test headline alpha/i }));

    // Verify we're on the article preview (in bubble view)
    expect(await screen.findByText(/read full article/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /explore related coverage/i })).toBeInTheDocument();

    // Click "Explore Related Coverage" button
    await user.click(screen.getByRole('button', { name: /explore related coverage/i }));

    // Verify we navigated to the topic view
    expect(window.location.hash).toBe('#topic');

    // Verify the topic heading matches the selected headline
    expect(screen.getByRole('heading', { name: sampleHeadlines[0].title })).toBeInTheDocument();

    // Verify searchAllSources was called with the headline title
    await waitFor(() => {
      expect(newsSourcesModule.searchAllSources).toHaveBeenCalledWith(sampleHeadlines[0].title);
    });

    // Verify the related articles are displayed
    await waitFor(() => {
      expect(screen.getByText(/related article about test headline alpha/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/another related article on the same topic/i)).toBeInTheDocument();
    expect(screen.getByText(/the guardian/i)).toBeInTheDocument();
    expect(screen.getByText(/bbc/i)).toBeInTheDocument();

    // Verify the count of articles is shown
    expect(screen.getByText(/2 articles from multi-source search/i)).toBeInTheDocument();
  });

  it('searches for related articles when "Explore Related Coverage" is clicked from article detail view', async () => {
    const mockSearchResults = [
      {
        title: 'In-depth analysis of Test headline alpha',
        url: 'https://example.com/analysis',
        source: 'NYT',
        snippet: 'Deep dive into the implications.',
        published_at: new Date().toISOString(),
      },
    ];

    vi.spyOn(newsSourcesModule, 'searchAllSources').mockResolvedValue(mockSearchResults);

    render(<App />);

    // Click on a bubble to go to article detail view
    await user.click(await screen.findByRole('button', { name: /test headline alpha/i }));

    // Verify we're in the bubble preview first
    expect(await screen.findByText(/read full article/i)).toBeInTheDocument();
    
    // Click "Read full article" link OR navigate to article view
    // The test already shows we're at article detail after clicking the bubble
    expect(window.location.hash).toBe('#article');

    // Find and click the "Explore Related Coverage" button in article detail view
    const exploreButton = screen.getByRole('button', { name: /explore related coverage/i });
    await user.click(exploreButton);

    // Verify navigation to topic view
    expect(window.location.hash).toBe('#topic');

    // Verify search was executed with the headline title
    await waitFor(() => {
      expect(newsSourcesModule.searchAllSources).toHaveBeenCalledWith(sampleHeadlines[0].title);
    });

    // Verify related articles are displayed
    await waitFor(() => {
      expect(screen.getByText(/in-depth analysis of test headline alpha/i)).toBeInTheDocument();
    });
    
    // Verify the article count is shown
    expect(screen.getByText(/1 articles from multi-source search/i)).toBeInTheDocument();
  });
});
