import { useState } from 'react';
import { solvePolynomial } from '../utils/polynomialSolver';
import type { PolynomialResult } from '../utils/polynomialSolver';
import './PolynomialSolver.css';

export function PolynomialSolver() {
  const [expression, setExpression] = useState<string>('');
  const [result, setResult] = useState<PolynomialResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (!expression.trim()) {
        setError('Please enter a polynomial expression');
        return;
      }

      const solution = solvePolynomial({ expression: expression.trim() });
      setResult(solution);
      
      if (solution.error) {
        setError(solution.error);
      }
    } catch (error) {
      setError('Invalid polynomial expression. Please enter a valid polynomial (e.g., x^2 - 3x + 2)');
    }
  };

  const formatRoot = (root: number | { re: number; im: number }) => {
    if (typeof root === 'number') {
      return root.toFixed(6);
    }
    const { re, im } = root;
    if (im === 0) return re.toFixed(6);
    return `${re.toFixed(6)} ${im > 0 ? '+' : '-'} ${Math.abs(im).toFixed(6)}i`;
  };

  return (
    <div className="polynomial-solver">
      <h1>Polynomial Root Solver</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="expression">
            Enter polynomial expression:
          </label>
          <input
            id="expression"
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="e.g., x^2 - 3x + 2"
          />
        </div>
        <button type="submit">Solve</button>
      </form>

      {error && <div className="error">{error}</div>}

      {result && !error && (
        <div className="results">
          <h2>Results</h2>
          <div className="polynomial">
            <strong>Polynomial:</strong> {expression}
          </div>
          <div className="roots">
            <strong>Roots:</strong>
            <ul>
              {result.roots.map((root, index) => (
                <li key={index}>{formatRoot(root)}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 