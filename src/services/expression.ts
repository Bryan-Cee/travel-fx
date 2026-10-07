export type ExpressionResult =
  | { status: 'valid'; value: number }
  | { status: 'incomplete' }
  | { status: 'invalid'; message: string };

type Token =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' }
  | { type: 'left' }
  | { type: 'right' };

function tokenize(input: string, decimalSeparator: string): Token[] {
  const normalized = input.replaceAll('×', '*').replaceAll('÷', '/');
  const tokens: Token[] = [];
  let index = 0;
  while (index < normalized.length) {
    const char = normalized[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (char === decimalSeparator || char === '.' || /\d/.test(char)) {
      let literal = '';
      let decimalCount = 0;
      while (index < normalized.length) {
        const current = normalized[index];
        if (/\d/.test(current)) literal += current;
        else if (current === decimalSeparator || current === '.') {
          decimalCount += 1;
          literal += '.';
        } else break;
        index += 1;
      }
      if (decimalCount > 1 || literal === '.') throw new Error('Invalid number');
      const value = Number(literal);
      if (!Number.isFinite(value)) throw new Error('Number is too large');
      tokens.push({ type: 'number', value });
      continue;
    }
    if (char === '+' || char === '-' || char === '*' || char === '/') {
      tokens.push({ type: 'operator', value: char });
      index += 1;
      continue;
    }
    if (char === '(') tokens.push({ type: 'left' });
    else if (char === ')') tokens.push({ type: 'right' });
    else throw new Error(`Unsupported character: ${char}`);
    index += 1;
  }
  return tokens;
}

class Parser {
  private index = 0;
  constructor(private readonly tokens: Token[]) {}

  parse(): number {
    const value = this.expression();
    if (this.index < this.tokens.length) throw new Error('Unexpected token');
    return value;
  }

  private expression(): number {
    let value = this.term();
    while (this.matchOperator('+') || this.matchOperator('-')) {
      const operator = (this.tokens[this.index - 1] as Extract<Token, { type: 'operator' }>).value;
      const right = this.term();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }

  private term(): number {
    let value = this.unary();
    while (this.matchOperator('*') || this.matchOperator('/')) {
      const operator = (this.tokens[this.index - 1] as Extract<Token, { type: 'operator' }>).value;
      const right = this.unary();
      if (operator === '/' && right === 0) throw new Error('Cannot divide by zero');
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  }

  private unary(): number {
    if (this.matchOperator('+')) return this.unary();
    if (this.matchOperator('-')) return -this.unary();
    return this.primary();
  }

  private primary(): number {
    const token = this.tokens[this.index];
    if (!token) throw new Error('Expression is incomplete');
    if (token.type === 'number') {
      this.index += 1;
      return token.value;
    }
    if (token.type === 'left') {
      this.index += 1;
      const value = this.expression();
      if (this.tokens[this.index]?.type !== 'right') throw new Error('Expression is incomplete');
      this.index += 1;
      return value;
    }
    throw new Error(token.type === 'right' ? 'Unexpected parenthesis' : 'Expression is incomplete');
  }

  private matchOperator(value: '+' | '-' | '*' | '/'): boolean {
    const token = this.tokens[this.index];
    if (token?.type === 'operator' && token.value === value) {
      this.index += 1;
      return true;
    }
    return false;
  }
}

export function evaluateExpression(input: string, decimalSeparator = '.'): ExpressionResult {
  if (!input.trim()) return { status: 'incomplete' };
  try {
    const tokens = tokenize(input, decimalSeparator);
    if (tokens.length === 0) return { status: 'incomplete' };
    const value = new Parser(tokens).parse();
    if (!Number.isFinite(value)) return { status: 'invalid', message: 'Result is not finite' };
    return { status: 'valid', value };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid expression';
    if (message === 'Expression is incomplete') return { status: 'incomplete' };
    return { status: 'invalid', message };
  }
}
