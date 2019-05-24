export interface IPosition {
  toString(): string;
}

export class TextPosition implements IPosition {
  readonly name: string;
  readonly line: number;
  readonly col: number;

  constructor (name: string, line: number, col: number) {
    this.name = name;
    this.line = line;
    this.col = col;
  }

  toString (): string {
    if (this.col == undefined) {
      return `${this.name}, line ${this.line}`;
    } else {
      return `${this.name}:${this.line}:${this.col}`;
    }
  }
}
