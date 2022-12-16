export class TerminalError extends Error {
  constructor(public cause: Error) {
    super(cause.message);
  }
}
