import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

describe('App routing', () => {
  afterEach(() => {
    cleanup();
    window.location.hash = '';
  });

  it('shows bubble map and navigates to topic view', async () => {
    render(<App />);

    const bubbleButton = await screen.findByRole('button', {
      name: /open topic view for global supply chains/i,
    });

    fireEvent.click(bubbleButton);

    expect(await screen.findByRole('heading', { name: /global supply chains/i })).toBeInTheDocument();
  });
});
