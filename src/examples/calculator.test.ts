import { calcLexer, calcParser, calculator } from './calculator';

describe('lexer', () => {
  test('should get all tokens', async () => {
    const tokens = calcLexer(`1 + 2 * 3`).map(({ type, value }) => ({
      type,
      value,
    }));
    const expectedTokens = [
      { type: 'number', value: '1' },
      { type: 'plus', value: '+' },
      { type: 'number', value: '2' },
      { type: 'multiply', value: '*' },
      { type: 'number', value: '3' },
    ];

    expect(tokens).toEqual(expectedTokens);
  });
});

describe('parser', () => {
  test('should parse', async () => {
    const result = calcParser(`2 * 3 + 1`);
    const expectedResult = {
      op: '+',
      left: '1',
      right: {
        op: '*',
        left: '2',
        right: '3',
      },
    };

    expect(result).toEqual(expectedResult);
  });
});

describe('interpreter', () => {
  test('should compute correct result', async () => {
    const result = calculator(`1 + 2 * 3`);
    const expectedResult = 7;

    expect(result).toEqual(expectedResult);
  });
});
