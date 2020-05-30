import {assert} from '../../err/InternalError';
import {Leaf} from '../../pp/Leaf';
import {TextPosition} from '../../util/Position';
import {configurableSyntaxParser} from '../Configuration';
import {Segment} from '../Segment';
import {parseRichText, RichText} from '../text/RichText';
import {Block} from './Block';
import {registerBlockParser} from './Parsers';

export type Cell = {
  text: RichText;
  heading: boolean;
};

export type Row = {
  cells: Cell[];
  heading: boolean;
};

export class Table extends Block {
  readonly head: Row[];
  readonly body: Row[];

  constructor (position: TextPosition, headings: Row[], body: Row[]) {
    super(position);
    this.head = headings;
    this.body = body;
  }
}

export const parseTable = configurableSyntaxParser(chunks => {
  assert(chunks.matchesPred(unit => unit.type == 'TABLE'));
  const rawTable = chunks.accept() as Leaf;

  const head: Row[] = [];
  const body: Row[] = [];

  const raw = Segment.fromLeaf(rawTable);
  raw.requireUnit('|');

  let headPassed = false;
  let cells: Cell[] = [];
  let expectedCells = -1;
  while (!raw.atEnd()) {
    // WARNING: This does not work if last line is separator and file doesn't have line terminator at end.
    if (raw.skipIfMatches('---|\n')) {
      // Head-body separator. Must only appear once.
      if (headPassed) {
        throw raw.constructSourceError('Table head separator already exists');
      }
      headPassed = true;
      while (body.length) {
        const row = body.shift()!;
        head.push({
          ...row,
          cells: row.cells.map(cell => ({
            ...cell,
            heading: true,
          })),
          heading: true,
        });
      }
    } else if (raw.peek() === '\n') {
      raw.skip();
      if (expectedCells == -1) {
        expectedCells = cells.length;
      } else if (cells.length != expectedCells) {
        throw raw.constructSourceError(`Expected ${expectedCells} cells, got ${cells.length}`);
      }
      body.push({cells: cells, heading: false});
      cells = [];
    } else {
      cells.push({text: parseRichText(raw.emptyCollected(), '|\n'), heading: false});
    }
    raw.requireUnit('|');
  }
  if (expectedCells != -1 && cells.length != expectedCells) {
    throw raw.constructSourceError(`Expected ${expectedCells} cells, got ${cells.length}`);
  }
  body.push({cells: cells, heading: false});

  assert(head.length + body.length > 0);

  return new Table(
    rawTable.position,
    head,
    body,
  );
}, {});

registerBlockParser('TABLE', parseTable);
