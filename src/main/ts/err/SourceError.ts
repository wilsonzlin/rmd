export class SourceError extends Error {
  constructor (message: string, sourceName: string, line: number, col?: number) {
    if (col == undefined) {
      super(`${message} [${sourceName}, line ${line}]`);
    } else {
      super(`${message} [${sourceName}:${line}:${col}]`);
    }
  }
}
