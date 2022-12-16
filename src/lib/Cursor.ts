export class Cursor {
  constructor(public position: number = 0) {}

  clone() {
    return new Cursor(this.position);
  }
}
