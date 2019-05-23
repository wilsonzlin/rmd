import {SourceError} from "../err/SourceError";
import {IPosition} from "./IPosition";
import {assertReason} from "../err/InternalError";

export interface Predicate<T> {
  (unit: T): boolean;
}

export abstract class Scanner<T, M, P extends IPosition> {
  static readonly EOD = null;

  private readonly metadata: M;
  private readonly source: T[];
  private next: number;

  constructor (metadata: M, source: T[]) {
    this.metadata = metadata;
    this.source = source;
    this.next = 0;
  }

  private constructSourceError (msg: string): SourceError {
    return new SourceError(msg, this.nextPosition());
  }

  private assertNotEOD (str: T | null): T {
    if (str == Scanner.EOD) {
      throw this.constructSourceError("Unexpected end of data");
    }
    return str;
  }

  private incrementNext (): void {
    this.next++;
  }

  atEnd (): boolean {
    return this.next >= this.source.length;
  }

  abstract nextPosition (): P;

  peekEOD (): T | null {
    if (this.next >= this.source.length) {
      return Scanner.EOD;
    }
    return this.source[this.next];
  }

  peek (): T {
    return this.assertNotEOD(this.peekEOD());
  }

  accept (): T {
    const next = this.peek();
    this.incrementNext();
    return next;
  }

  skip (): void {
    this.incrementNext();
  }

  skipAmount (len: number): number {
    assertReason(this.next + len > this.source.length, "Skip amount exceeds end of data");
    for (let i = 0; i < len; i++) {
      this.incrementNext();
    }
    return len;
  }

  skipIfMatches (match: T[]): number {
    return this.skipAmount(this.matches(match));
  }

  skipWhile (pred: Predicate<T>): number {
    let count = 0;
    while (this.next < this.source.length && pred(this.source[this.next])) {
      this.next++;
      count++;
    }
    return count;
  }

  skipUntil (pred: Predicate<T>): number {
    let count = 0;
    while (this.next < this.source.length && !pred(this.source[this.next])) {
      this.next++;
      count++;
    }
    return count;
  }

  matchesUnit (char: T): boolean {
    return this.source[this.next] === char;
  }

  matchesPred (pred: Predicate<T>): boolean {
    return this.next < this.source.length && pred(this.source[this.next]);
  }

  matches (match: T[]): number {
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

  requireChar (char: T): void {
    if (!this.matchesUnit(char)) {
      throw this.constructSourceError(`Required \`${char}\``);
    }
    this.skip();
  }

  requirePred (pred: Predicate<T>, desc: string): void {
    if (!this.matchesPred(pred)) {
      throw this.constructSourceError(`Required syntax not found: ${desc}`);
    }
    this.skip();
  }

  require (match: T[], desc: string): number {
    if (!this.matches(match)) {
      throw this.constructSourceError(`Required syntax not found: ${desc}`);
    }
    this.skipAmount(match.length);
    return match.length;
  }
}
