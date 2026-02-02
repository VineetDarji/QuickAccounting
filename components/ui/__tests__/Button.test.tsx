import React from 'react';
import { render, screen } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  test('renders with default variant and size', () => {
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByText(/Click Me/i);
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('bg-indigo-600'); // primary variant
    expect(buttonElement).toHaveClass('px-6'); // md size
  });

  test('renders with secondary variant', () => {
    render(<Button variant="secondary">Click Me</Button>);
    const buttonElement = screen.getByText(/Click Me/i);
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('bg-slate-900');
  });

  test('renders with large size', () => {
    render(<Button size="lg">Click Me</Button>);
    const buttonElement = screen.getByText(/Click Me/i);
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('px-8');
  });

  test('handles onClick event', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    screen.getByText(/Click Me/i).click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
