import {assert} from '../../err/InternalError';
import {Chunks} from '../../pp/Chunk';
import {Container} from '../../pp/Container';
import {TextPosition} from '../../util/Position';
import {configurableSyntaxParser} from '../Configuration';
import {Block} from './Block';
import {parseBlocks} from './Blocks';
import {registerBlockParser} from './Parsers';

export class Quote extends Block {
  readonly contents: Block[];

  constructor (position: TextPosition, contents: Block[]) {
    super(position);
    this.contents = contents;
  }
}

export const parseQuote = configurableSyntaxParser(chunks => {
  assert(chunks.matchesPred(unit => unit.type == 'QUOTE'));
  const rawQuote = chunks.accept() as Container;

  return new Quote(
    rawQuote.position,
    parseBlocks(new Chunks(rawQuote.contents)),
  );
}, {});

registerBlockParser('QUOTE', parseQuote);
