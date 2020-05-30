import {Leaf} from '../pp/Leaf';
import {TextPosition} from '../util/Position';
import {Scanner} from '../util/Scanner';

export class Segment extends Scanner<string, TextPosition, string> {
  private readonly name: string;
  private readonly source: string;
  private readonly indent: number;

  private next: number;
  private line: number;
  private nextCol: number;

  constructor (name: string, sourceLines: string[], baseLine: number, indent: number) {
    super();
    this.name = name;
    this.source = sourceLines.join('\n');
    this.indent = indent;

    this.next = 0;
    this.line = baseLine;
    this.nextCol = 0;
  }

  static fromLeaf (leaf: Leaf): Segment {
    const position = leaf.position;
    return new Segment(position.name, leaf.contents, position.line, position.col);
  }

  isLineTerminator (): boolean {
    return this.peekEOD() == '\n';
  }

  hasRemaining (amount: number): boolean {
    return this.next + amount <= this.source.length;
  }

  nextPosition (): TextPosition {
    return new TextPosition(this.name, this.line, this.nextCol);
  }

  nextPositionInSegment (): number {
    return this.next;
  }

  peekOffsetEOD (offset: number): string | null {
    return this.source[this.next + offset] || null;
  }

  protected incrementNext (): void {
    // A line starts after the previous line's terminator.
    if (this.source[this.next++] == '\n') {
      this.line++;
      this.nextCol = this.indent;
    } else {
      this.nextCol++;
    }
  }
}
