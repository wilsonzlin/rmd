export interface IPosition {
  toString (): string;
}

export class SourcePosition implements IPosition {
  readonly name: string;

  constructor (name: string) {
    this.name = name;
  }

  toString (): string {
    return this.name;
  }
}

export class TextPosition extends SourcePosition {
  readonly line: number;
  readonly col: number;

  constructor (name: string, line: number, col: number) {
    super(name);
    this.line = line;
    this.col = col;
  }

  toString (): string {
    return `${this.name}, line ${this.line}, column ${this.col}`;
  }
}
