import {SourceError} from "./err/SourceError";
import {InternalError} from "./err/InternalError";

export interface Predicate {
  (char: string): boolean;
}

export class Code {
  private static readonly EOF = "";

  private readonly sourceName: string;
  private readonly source: string;
  private next: number;
  private line: number;
  private col: number;

  constructor (sourceName: string, source: string) {
    this.sourceName = sourceName;
    // Normalise line terminators.
    this.source = source.replace(/\r\n?/g, "\n");
    this.next = 0;
    this.line = 1;
    this.col = 0;
  }

  private constructSourceError (msg: string): SourceError {
    return new SourceError(msg, this.sourceName, this.line, this.col);
  }

  private assertNotEOF (str: string): string {
    if (str == Code.EOF) {
      throw this.constructSourceError("Unexpected end of code");
    }
    return str;
  }

  private incrementNext (): void {
    if (this.source[this.next++] === "\n") {
      this.line++;
      this.col = 0;
    } else {
      this.col++;
    }
  }

  peekEOF (): string {
    return this.source[this.next] || Code.EOF;
  }

  peek (): string {
    return this.assertNotEOF(this.peekEOF());
  }

  isLineTerminator (): boolean {
    return this.peekEOF() == "\n";
  }

  accept (): string {
    const next = this.peek();
    this.incrementNext();
    return next;
  }

  skip (): void {
    this.incrementNext();
  }

  skipAmount (len: number): number {
    if (this.next + len > this.source.length) {
      throw new InternalError("Skip amount exceeds EOF");
    }
    for (let i = 0; i < len; i++) {
      this.incrementNext();
    }
    return len;
  }

  skipIfMatches (match: string): number {
    return this.skipAmount(this.matches(match));
  }

  skipWhile (pred: Predicate): number {
    let count = 0;
    while (this.next < this.source.length && pred(this.source[this.next])) {
      this.next++;
      count++;
    }
    return count;
  }

  skipUntil (pred: Predicate): number {
    let count = 0;
    while (this.next < this.source.length && !pred(this.source[this.next])) {
      this.next++;
      count++;
    }
    return count;
  }

  matchesChar (char: string): boolean {
    return this.source[this.next] === char;
  }

  matchesPred (pred: Predicate): boolean {
    return this.next < this.source.length && pred(this.source[this.next]);
  }

  matches (match: string): number {
    if (this.next + match.length > this.source.length) {
      return 0;
    }

    for (let i = 0; i < match.length; i++) {
      if (this.source[this.next + i] != match[i]) {
        return 0;
      }
    }

    return match.length;
  }

  requireChar (char: string): void {
    if (!this.matchesChar(char)) {
      throw this.constructSourceError(`Required character \`${char}\``);
    }
    this.skip();
  }

  requirePred (pred: Predicate, desc: string): void {
    if (!this.matchesPred(pred)) {
      throw this.constructSourceError(`Required syntax not found: ${desc}`);
    }
    this.skip();
  }

  require (match: string, desc: string): number {
    if (!this.matches(match)) {
      throw this.constructSourceError(`Required syntax not found: ${desc}`);
    }
    this.skipAmount(match.length);
    return match.length;
  }
}
