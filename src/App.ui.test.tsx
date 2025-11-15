import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('App integration view', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    window.location.hash = '#bubble';
  });

  afterEach(() => {
    window.location.hash = '#bubble';
  });

  it('renders the bubble map by default and navigates to topic view', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /issue-centric news/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /global supply chains/i }));

    expect(screen.getByRole('heading', { name: 'Global Supply Chains' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#topic');
  });
});
