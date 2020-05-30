import {assert} from '../../err/InternalError';
import {Chunks} from '../../pp/Chunk';
import {Leaf} from '../../pp/Leaf';
import {TextPosition} from '../../util/Position';
import {configurableSyntaxParser} from '../Configuration';
import {Segment} from '../Segment';
import {parseRichText, RichText} from '../text/RichText';
import {Block} from './Block';

export class Paragraph extends Block {
  readonly text: RichText;

  constructor (position: TextPosition, text: RichText) {
    super(position);
    this.text = text;
  }
}

export const parseParagraph = configurableSyntaxParser((chunks: Chunks): Paragraph => {
  assert(chunks.matchesPred(unit => unit.type == 'PARAGRAPH'));
  const raw = chunks.accept() as Leaf;

  return new Paragraph(raw.position, parseRichText(Segment.fromLeaf(raw)));
}, {});
