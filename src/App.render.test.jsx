import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App rendering', () => {
  test('renders application title', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /canada world cup 2026 path probabilities/i })).toBeInTheDocument();
  });

  test('renders filter controls', async () => {
    render(<App />);
    expect(screen.getByText('Spotlight Country')).toBeInTheDocument();
    expect(screen.getByText('Match')).toBeInTheDocument();
  });

  test('renders probability table', async () => {
    render(<App />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders country selector', async () => {
    render(<App />);
    expect(screen.getByText('Spotlight Country')).toBeInTheDocument();
  });

  test('renders match selector', async () => {
    render(<App />);
    expect(screen.getByText('Match')).toBeInTheDocument();
  });

  test('renders loading state initially', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /canada world cup 2026 path probabilities/i })).toBeInTheDocument();
  });

  test('defaults the match scenario venue to Toronto Stadium', async () => {
    render(<App />);
    expect(await screen.findByText('Canada 0-0 Mexico (Toronto Stadium)')).toBeInTheDocument();
  });
});
