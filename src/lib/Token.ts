export class Token<T extends string | number | symbol = string> {
  constructor(
    public type: T,
    public value: string,
    public pos: {
      start: { line: number; col: number };
      end: { line: number; col: number };
    },
  ) {}

  public displayPosition() {
    return `line ${this.pos.start.line}, col ${this.pos.start.col}`;
  }
}
