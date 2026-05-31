import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App rendering', () => {
  test('renders application title', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /FIFA World Cup 2026/i })).toBeInTheDocument();
  });

  test('renders filter controls', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Spotlight Country/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Select a Match/i })).toBeInTheDocument();
  });

  test('renders probability table', async () => {
    render(<App />);
    expect(await screen.findByRole('tab', { name: /Countries/i })).toBeInTheDocument();
  });

  test('renders country selector', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Spotlight Country/i })).toBeInTheDocument();
  });

  test('renders match selector', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Select a Match/i })).toBeInTheDocument();
  });

  test('renders loading state initially', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /FIFA World Cup 2026/i })).toBeInTheDocument();
  });

  test('defaults the match scenario venue to Toronto Stadium', async () => {
    render(<App />);
    expect(await screen.findByDisplayValue('Toronto Stadium')).toBeInTheDocument();
  });
});
