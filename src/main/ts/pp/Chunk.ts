import {Container} from "./Container";
import {Leaf} from "./Leaf";
import {Scanner} from "../util/Scanner";
import {TextPosition} from "../util/Position";

export type Chunk = Container | Leaf;

export class Chunks extends Scanner<Chunk, TextPosition> {
  private readonly source: Chunk[];
  private next: number;

  constructor (source: Chunk[]) {
    super();
    this.source = source;
    this.next = 0;
  }

  nextPosition (): TextPosition {
    return this.peek().position;
  }

  protected hasRemaining (amount: number): boolean {
    return this.next + amount <= this.source.length;
  }

  protected incrementNext (): void {
    this.next++;
  }

  peekOffsetEOD (offset: number): Container | Leaf | null {
    return this.source[this.next + offset] || null;
  }
}
