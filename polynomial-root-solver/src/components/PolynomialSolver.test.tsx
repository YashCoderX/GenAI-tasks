import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PolynomialSolver } from './PolynomialSolver';

describe('PolynomialSolver Component', () => {
  it('renders the component', () => {
    render(<PolynomialSolver />);
    expect(screen.getByText('Polynomial Root Solver')).toBeInTheDocument();
  });

  it('solves a quadratic equation', () => {
    render(<PolynomialSolver />);
    
    const input = screen.getByPlaceholderText(/e.g., x\^2 - 3x \+ 2/);
    fireEvent.change(input, { target: { value: 'x^2 - 3x + 2' } });
    
    const button = screen.getByText('Solve');
    fireEvent.click(button);
    
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText(/x\^2 - 3x \+ 2/)).toBeInTheDocument();
  });

  it('handles invalid input', () => {
    render(<PolynomialSolver />);
    
    const input = screen.getByPlaceholderText(/e.g., x\^2 - 3x \+ 2/);
    fireEvent.change(input, { target: { value: 'invalid' } });
    
    const button = screen.getByText('Solve');
    fireEvent.click(button);
    
    expect(screen.getByText(/Invalid polynomial expression/)).toBeInTheDocument();
  });

  it('handles empty input', () => {
    render(<PolynomialSolver />);
    
    const button = screen.getByText('Solve');
    fireEvent.click(button);
    
    expect(screen.getByText(/Please enter a polynomial expression/)).toBeInTheDocument();
  });

  it('handles complex roots', () => {
    render(<PolynomialSolver />);
    
    const input = screen.getByPlaceholderText(/e.g., x\^2 - 3x \+ 2/);
    fireEvent.change(input, { target: { value: 'x^2 + 1' } });
    
    const button = screen.getByText('Solve');
    fireEvent.click(button);
    
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText(/x\^2 \+ 1/)).toBeInTheDocument();
  });
}); 