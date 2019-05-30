import {SourceError} from "../err/SourceError";
import {IPosition} from "./Position";
import {assertReason} from "../err/InternalError";

export interface Predicate<T> {
  (unit: T): boolean;
}

/**
 * A scanner's model of the data is a sequence of units, with each unit having an index.
 * However, the underlying data might be organised completely differently. For example, the data for code (a sequence of characters) might be:
 * - a contiguous array in memory
 * - an array of strings (sequence of lines)
 * - a continuous stream or window
 * - inconsistently scrambled or interspersed across a large file
 * - rows from a database
 * Units must be comparable directly (using == and !=) and have a string representation.
 */
export abstract class Scanner<U, P extends IPosition, S extends ArrayLike<U> = U[]> {
  static readonly EOD = null;

  private readonly _collected: U[] = [];

  constructSourceError (msg: string): SourceError {
    return new SourceError(msg, this.nextPosition());
  }

  atEnd (): boolean {
    return !this.hasRemaining(1);
  }

  abstract nextPosition (): P;

  lastCollectedMarker (): number {
    return this._collected.length - 1;
  }

  collected (start?: number, end?: number): U[] {
    return this._collected.slice(start, end);
  }

  emptyCollected (): this {
    this._collected.length = 0;
    return this;
  }

  abstract peekOffsetEOD (offset: number): U | null;

  peekOffset (offset: number): U {
    return this.assertNotEOD(this.peekOffsetEOD(offset));
  }

  peekEOD (): U | null {
    return this.peekOffsetEOD(0);
  }

  peek (): U {
    return this.assertNotEOD(this.peekEOD());
  }

  accept (): U {
    const next = this.peek();
    this.incrementNext();
    this._collected.push(next);
    return next;
  }

  // Not the same as accept, as this doesn't fill collected array.
  skip (): U {
    const next = this.peek();
    this.incrementNext();
    return next;
  }

  skipAmount (len: number): number {
    assertReason(this.hasRemaining(len), "Skip amount exceeds end of data");
    for (let i = 0; i < len; i++) {
      this.incrementNext();
    }
    return len;
  }

  skipIf (unit: U): boolean {
    if (this.peek() == unit) {
      this.skip();
      return true;
    }
    return false;
  }

  skipIfMatches (match: S): number {
    return this.skipAmount(this.matchesSequence(match));
  }

  skipWhile (pred: Predicate<U>): number {
    let count = 0;
    while (!this.atEnd() && pred(this.peek())) {
      this.incrementNext();
      count++;
    }
    return count;
  }

  skipUntil (pred: Predicate<U>): number {
    let count = 0;
    while (!this.atEnd() && !pred(this.peek())) {
      this.incrementNext();
      count++;
    }
    return count;
  }

  matchesUnit (unit: U): boolean {
    return this.peek() === unit;
  }

  matchesPred (pred: Predicate<U>): boolean {
    return pred(this.peek());
  }

  matchesSequence (match: S): number {
    if (!this.hasRemaining(match.length)) {
      return 0;
    }

    for (let i = 0; i < match.length; i++) {
      if (this.peekOffsetEOD(i) != match[i]) {
        return 0;
      }
    }

    return match.length;
  }

  requireUnit (unit: U): void {
    if (!this.matchesUnit(unit)) {
      throw this.constructSourceError(`Required "${unit}", got "${this.peek()}"`);
    }
    this.accept();
  }

  requirePred (pred: Predicate<U>, desc: string): U {
    if (!this.matchesPred(pred)) {
      throw this.constructSourceError(`Required syntax not found: ${desc}`);
    }
    return this.accept();
  }

  requireSequence (match: S, desc: string): number {
    if (!this.matchesSequence(match)) {
      throw this.constructSourceError(`Required syntax not found: ${desc}`);
    }
    for (let i = 0; i < match.length; i++) {
      this.accept();
    }
    return match.length;
  }

  requireSkipSequence (match: S, desc: string): number {
    if (!this.matchesSequence(match)) {
      throw this.constructSourceError(`Required syntax not found: ${desc}`);
    }
    this.skipAmount(match.length);
    return match.length;
  }

  protected abstract incrementNext (): void;

  protected abstract hasRemaining (amount: number): boolean;

  private assertNotEOD (str: U | null): U {
    if (str == Scanner.EOD) {
      throw this.constructSourceError("Unexpected end of data");
    }
    return str;
  }
}
