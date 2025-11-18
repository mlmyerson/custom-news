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
    window.location.hash = '#tile';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.location.hash = '#tile';
  });

  it('renders the tile mosaic by default and navigates to topic view from preview', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /see the issues every outlet repeats today/i })).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: /test headline alpha/i }));

    expect(screen.getByText(/read full article/i)).toBeInTheDocument();
    expect(window.location.hash).toBe('#tile');

    await user.click(screen.getByRole('button', { name: /explore related coverage/i }));

    expect(screen.getByRole('heading', { name: sampleHeadlines[0].title })).toBeInTheDocument();
    expect(window.location.hash).toBe('#topic');
  });
});
