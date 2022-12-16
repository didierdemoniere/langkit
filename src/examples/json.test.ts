import { jsonLexer, jsonParser } from './json';

describe('lexer', () => {
  test('should get all tokens', async () => {
    const tokens = jsonLexer(`{ "firstName": "John" }`).map(
      ({ type, value }) => ({ type, value }),
    );
    const expectedTokens = [
      { type: 'lCurly', value: '{' },
      { type: 'string', value: '"firstName"' },
      { type: 'colon', value: ':' },
      { type: 'string', value: '"John"' },
      { type: 'rCurly', value: '}' },
    ];

    expect(tokens).toEqual(expectedTokens);
  });
});

describe('parser', () => {
  test('should parse', async () => {
    const result = jsonParser(`{
      "firstName": "John",
      "lastName": "Smith",
      "isAlive": true,
      "age": 25,
      "friends": [
        "johnny",
        "terry"
      ]
    }`);

    const expectedResult = {
      firstName: 'John',
      lastName: 'Smith',
      isAlive: true,
      age: 25,
      friends: ['johnny', 'terry'],
    };

    expect(result).toEqual(expectedResult);
  });
});
