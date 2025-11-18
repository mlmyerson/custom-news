import { render, screen } from '@testing-library/react';
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

  it('redirects to Google search when "Explore Related Coverage" is clicked from bubble preview', async () => {
    render(<App />);

    // Wait for headlines to load and click on the first bubble
    await user.click(await screen.findByRole('button', { name: /test headline alpha/i }));

    // Verify we're on the article preview (in bubble view)
    expect(await screen.findByText(/read full article/i)).toBeInTheDocument();
    
    // Find the "Explore Related Coverage" link
    const exploreLink = screen.getByRole('link', { name: /explore related coverage/i });
    expect(exploreLink).toBeInTheDocument();

    // Verify the link points to a Google search with the article title
    const expectedUrl = `https://www.google.com/search?q=${encodeURIComponent(sampleHeadlines[0].title)}`;
    expect(exploreLink).toHaveAttribute('href', expectedUrl);
    expect(exploreLink).toHaveAttribute('target', '_blank');
    expect(exploreLink).toHaveAttribute('rel', 'noreferrer');
  });

  it('redirects to Google search when "Explore Related Coverage" is clicked from article detail view', async () => {
    render(<App />);

    // Click on a bubble to go to article detail view
    await user.click(await screen.findByRole('button', { name: /test headline alpha/i }));

    // Verify we're in the article detail view
    expect(await screen.findByText(/read full article/i)).toBeInTheDocument();
    expect(window.location.hash).toBe('#article');

    // Find the "Explore Related Coverage" link in article detail view
    const exploreLink = screen.getByRole('link', { name: /explore related coverage/i });
    expect(exploreLink).toBeInTheDocument();

    // Verify the link points to a Google search with the article title
    const expectedUrl = `https://www.google.com/search?q=${encodeURIComponent(sampleHeadlines[0].title)}`;
    expect(exploreLink).toHaveAttribute('href', expectedUrl);
    expect(exploreLink).toHaveAttribute('target', '_blank');
    expect(exploreLink).toHaveAttribute('rel', 'noreferrer');
  });
});
