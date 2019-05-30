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
    if (this.atEnd()) {
      return new TextPosition(this.source[0].position.name, -1, 0);
    }
    return this.peek().position;
  }

  peekOffsetEOD (offset: number): Container | Leaf | null {
    return this.source[this.next + offset] || null;
  }

  protected hasRemaining (amount: number): boolean {
    return this.next + amount <= this.source.length;
  }

  protected incrementNext (): void {
    this.next++;
  }
}
