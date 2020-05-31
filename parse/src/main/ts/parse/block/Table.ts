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
};

export type Row = {
  cells: Cell[];
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
  raw.requireSkipSequence('|', 'Table row initial bar');

  let headPassed = false;
  let cells: Cell[] = [];
  while (!raw.atEnd()) {
    // WARNING: This does not work if last line is separator and file doesn't have line terminator at end.
    if (raw.skipIfMatches('---|\n')) {
      // Head-body separator. Must only appear once.
      if (headPassed) {
        throw raw.constructSourceError('Table head separator already exists');
      }
      headPassed = true;
      head.push(...body.splice(0, body.length));
    } else if (raw.skipIf('\n')) {
      // End of row.
      body.push({cells});
      cells = [];
    } else {
      // Discard text from previous cell.
      raw.emptyCollected();
      cells.push({text: parseRichText(raw, '|\n')});
    }
    raw.requireSkipSequence('|', 'Table cell bar');
  }
  body.push({cells});

  assert(head.length + body.length > 0);

  return new Table(
    rawTable.position,
    head,
    body,
  );
}, {});

registerBlockParser('TABLE', parseTable);
