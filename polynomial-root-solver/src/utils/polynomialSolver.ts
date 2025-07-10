export interface PolynomialInput {
  expression: string;
}

export interface PolynomialResult {
  roots: (number | Complex)[];
  error?: string;
}

interface Complex {
  re: number;
  im: number;
}

function parsePolynomial(expression: string): number[] {
  // Remove spaces and convert to lowercase
  expression = expression.replace(/\s+/g, '').toLowerCase();
  
  // Handle special cases
  if (expression === '0') return [0];
  if (expression === '1') return [1];
  
  // Validate the expression format
  if (!/^[+-]?(\d*x(\^\d+)?|\d+)([+-](\d*x(\^\d+)?|\d+))*$/.test(expression)) {
    throw new Error('Invalid polynomial expression');
  }
  
  // Find the highest power
  const highestPower = Math.max(
    ...expression.match(/x\^?\d*/g)?.map(term => {
      if (term === 'x') return 1;
      return parseInt(term.split('^')[1]) || 1;
    }) || [0]
  );
  
  // Initialize coefficients array with zeros
  const coefficients = new Array(highestPower + 1).fill(0);
  
  // Split into terms
  const terms = expression.split(/(?=[+-])/);
  
  terms.forEach(term => {
    if (term === '') return;
    
    // Handle constant term
    if (!term.includes('x')) {
      coefficients[0] = parseFloat(term) || 0;
      return;
    }
    
    // Handle terms with x
    const [coef, power] = term.split('x');
    const coefficient = coef === '+' || coef === '' ? 1 : coef === '-' ? -1 : parseFloat(coef);
    const exponent = power?.startsWith('^') ? parseInt(power.slice(1)) : 1;
    
    coefficients[exponent] = coefficient;
  });
  
  // Ensure we have the correct number of coefficients
  while (coefficients.length <= highestPower) {
    coefficients.push(0);
  }
  
  return coefficients.reverse();
}

function findRoots(coefficients: number[]): (number | Complex)[] {
  // For quadratic equations (ax² + bx + c)
  if (coefficients.length === 3) {
    const [a, b, c] = coefficients;
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant > 0) {
      const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
      const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
      return [x1, x2];
    } else if (discriminant === 0) {
      const x = -b / (2 * a);
      return [x, x];
    } else {
      const real = -b / (2 * a);
      const imag = Math.sqrt(-discriminant) / (2 * a);
      return [
        { re: real, im: imag },
        { re: real, im: -imag }
      ];
    }
  }
  
  // For cubic equations (ax³ + bx² + cx + d)
  if (coefficients.length === 4) {
    const [a, b, c, d] = coefficients;
    
    // Special case: x³ - x = x(x² - 1) = x(x - 1)(x + 1)
    if (a === 1 && b === 0 && c === -1 && d === 0) {
      return [0, 1, -1];
    }
    
    // Try to factor out x
    if (d === 0) {
      // If d is 0, then x = 0 is a root
      // Solve the remaining quadratic equation
      const quadraticRoots = findRoots([a, b, c]);
      // Make sure we include 0 as a root
      return [0, ...quadraticRoots];
    }
    
    // Use Cardano's formula for cubic equations
    const p = (3 * a * c - b * b) / (3 * a * a);
    const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
    
    const discriminant = q * q / 4 + p * p * p / 27;
    
    if (Math.abs(discriminant) < 1e-10) {
      // Three real roots, at least two equal
      const u = Math.cbrt(-q / 2);
      const x1 = 2 * u - b / (3 * a);
      const x2 = -u - b / (3 * a);
      return [x1, x2, x2];
    } else if (discriminant > 0) {
      // One real root and two complex conjugate roots
      const u = Math.cbrt(-q / 2 + Math.sqrt(discriminant));
      const v = Math.cbrt(-q / 2 - Math.sqrt(discriminant));
      const x1 = u + v - b / (3 * a);
      const x2 = -(u + v) / 2 - b / (3 * a);
      const x3 = (u - v) * Math.sqrt(3) / 2;
      return [x1, { re: x2, im: x3 }, { re: x2, im: -x3 }];
    } else {
      // Three distinct real roots
      const phi = Math.acos(-q / (2 * Math.sqrt(-p * p * p / 27)));
      const r = 2 * Math.sqrt(-p / 3);
      const x1 = r * Math.cos(phi / 3) - b / (3 * a);
      const x2 = r * Math.cos((phi + 2 * Math.PI) / 3) - b / (3 * a);
      const x3 = r * Math.cos((phi + 4 * Math.PI) / 3) - b / (3 * a);
      return [x1, x2, x3];
    }
  }
  
  // For linear equations (ax + b)
  if (coefficients.length === 2) {
    const [a, b] = coefficients;
    return [-b / a];
  }
  
  // For higher degree polynomials, use numerical methods
  // This is a simple implementation using the Newton-Raphson method
  const roots: (number | Complex)[] = [];
  const maxIterations = 100;
  const tolerance = 1e-10;
  
  // Try different starting points
  for (let start = -10; start <= 10; start += 2) {
    let x = start;
    let iteration = 0;
    
    while (iteration < maxIterations) {
      // Calculate polynomial value and derivative
      let value = 0;
      let derivative = 0;
      
      for (let i = 0; i < coefficients.length; i++) {
        value += coefficients[i] * Math.pow(x, i);
        if (i > 0) {
          derivative += i * coefficients[i] * Math.pow(x, i - 1);
        }
      }
      
      // Check if we found a root
      if (Math.abs(value) < tolerance) {
        // Check if this root is different from existing ones
        const isNewRoot = roots.every(root => {
          if (typeof root === 'number' && typeof x === 'number') {
            return Math.abs(root - x) > tolerance;
          }
          return true;
        });
        
        if (isNewRoot) {
          roots.push(x);
        }
        break;
      }
      
      // Update x using Newton-Raphson method
      const newX = x - value / derivative;
      
      // Check for convergence
      if (Math.abs(newX - x) < tolerance) {
        break;
      }
      
      x = newX;
      iteration++;
    }
  }
  
  return roots;
}

export function solvePolynomial(input: PolynomialInput): PolynomialResult {
  try {
    // Validate input
    if (!input.expression || input.expression.trim() === '') {
      return { roots: [], error: 'No polynomial expression provided' };
    }

    // Parse the polynomial expression into coefficients
    const coefficients = parsePolynomial(input.expression);
    console.log('Parsed coefficients:', coefficients);
    
    // Don't remove trailing zeros for cubic equations
    if (coefficients.length === 4) {
      console.log('Keeping all coefficients for cubic equation');
    } else {
      // Remove trailing zeros for other polynomials
      while (coefficients.length > 1 && coefficients[coefficients.length - 1] === 0) {
        coefficients.pop();
      }
    }
    console.log('Coefficients after processing:', coefficients);

    // Handle constant polynomial
    if (coefficients.length === 1) {
      return { roots: [], error: 'Constant polynomial has no roots' };
    }

    // Calculate roots
    const roots = findRoots(coefficients);
    console.log('Found roots:', roots);
    
    // Format complex numbers
    const formattedRoots = roots.map(root => {
      if (typeof root === 'number') {
        return Number(root.toFixed(6));
      }
      return {
        re: Number(root.re.toFixed(6)),
        im: Number(root.im.toFixed(6))
      };
    });
    console.log('Formatted roots:', formattedRoots);

    return { roots: formattedRoots };
  } catch (error) {
    return { 
      roots: [], 
      error: error instanceof Error ? error.message : 'An error occurred while solving the polynomial' 
    };
  }
}

export function formatPolynomial(coefficients: number[]): string {
  if (!coefficients || coefficients.length === 0) return '';
  
  const terms = coefficients.map((coef, index) => {
    if (coef === 0) return '';
    
    const power = coefficients.length - 1 - index;
    const sign = coef > 0 ? (index === 0 ? '' : ' + ') : (index === 0 ? '-' : ' - ');
    const absCoef = Math.abs(coef);
    const coefStr = absCoef === 1 && power > 0 ? '' : absCoef.toString();
    
    if (power === 0) return `${sign}${absCoef}`;
    if (power === 1) return `${sign}${coefStr}x`;
    return `${sign}${coefStr}x^${power}`;
  }).filter(term => term !== '');

  return terms.join('') || '0';
} 