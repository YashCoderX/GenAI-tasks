import { describe, it, expect } from 'vitest';
import { solvePolynomial, formatPolynomial } from './polynomialSolver';

describe('Polynomial Solver', () => {
  describe('solvePolynomial', () => {
    it('should solve a quadratic equation', () => {
      const result = solvePolynomial({ expression: 'x^2 - 3x + 2' });
      expect(result.roots).toHaveLength(2);
      expect(result.roots).toEqual([2, 1]);
    });

    it('should solve a cubic equation', () => {
      const result = solvePolynomial({ expression: 'x^3 - x' });
      expect(result.roots).toHaveLength(3);
      expect(result.roots).toEqual([0, 1, -1]);
    });

    it('should handle complex roots', () => {
      const result = solvePolynomial({ expression: 'x^2 + 1' });
      expect(result.roots).toHaveLength(2);
      expect(result.roots[0]).toEqual({ re: 0, im: 1 });
      expect(result.roots[1]).toEqual({ re: 0, im: -1 });
    });

    it('should handle empty input', () => {
      const result = solvePolynomial({ expression: '' });
      expect(result.error).toBe('No polynomial expression provided');
    });

    it('should handle constant polynomial', () => {
      const result = solvePolynomial({ expression: '5' });
      expect(result.error).toBe('Constant polynomial has no roots');
    });

    it('should handle trailing zeros', () => {
      const result = solvePolynomial({ expression: 'x^2 - 3x + 2' });
      expect(result.roots).toHaveLength(2);
      expect(result.roots).toEqual([2, 1]);
    });

    it('should handle zero polynomial', () => {
      const result = solvePolynomial({ expression: '0' });
      expect(result.error).toBe('Constant polynomial has no roots');
    });
  });

  describe('formatPolynomial', () => {
    it('should format a quadratic polynomial', () => {
      expect(formatPolynomial([1, -3, 2])).toBe('x^2 - 3x + 2');
    });

    it('should format a cubic polynomial', () => {
      expect(formatPolynomial([1, 0, -1, 0])).toBe('x^3 - x');
    });

    it('should format a polynomial with negative leading coefficient', () => {
      expect(formatPolynomial([-1, 3, -2])).toBe('-x^2 + 3x - 2');
    });

    it('should format a polynomial with zero coefficients', () => {
      expect(formatPolynomial([1, 0, 0, 1])).toBe('x^3 + 1');
    });

    it('should handle empty input', () => {
      expect(formatPolynomial([])).toBe('');
    });

    it('should handle single coefficient', () => {
      expect(formatPolynomial([5])).toBe('5');
    });

    it('should handle all zeros', () => {
      expect(formatPolynomial([0, 0, 0])).toBe('0');
    });
  });
}); 