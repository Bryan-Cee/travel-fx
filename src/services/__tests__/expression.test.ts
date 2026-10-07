import { evaluateExpression } from '../expression';

describe('evaluateExpression', () => {
  it('honors precedence and parentheses', () => {
    expect(evaluateExpression('2 + 3 × (4 - 1)')).toEqual({ status: 'valid', value: 11 });
  });

  it('supports unary signs and locale decimals', () => {
    expect(evaluateExpression('-(1,5 + +2)', ',')).toEqual({ status: 'valid', value: -3.5 });
  });

  it('keeps incomplete expressions editable', () => {
    expect(evaluateExpression('12 ÷')).toEqual({ status: 'incomplete' });
    expect(evaluateExpression('(2 + 3')).toEqual({ status: 'incomplete' });
  });

  it('rejects invalid and non-finite operations', () => {
    expect(evaluateExpression('1 ÷ 0')).toEqual({ status: 'invalid', message: 'Cannot divide by zero' });
    expect(evaluateExpression('2 + nope').status).toBe('invalid');
  });
});
