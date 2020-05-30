import {assert} from '../../err/InternalError';
import {Leaf} from '../../pp/Leaf';
import {TextPosition} from '../../util/Position';
import {configurableSyntaxParser} from '../Configuration';
import {Block} from './Block';

export class CodeBlock extends Block {
  readonly lang: string | null;
  readonly data: string;

  constructor (position: TextPosition, lang: string | null, data: string) {
    super(position);
    this.lang = lang;
    this.data = data;
  }
}

export const parseCodeBlock = configurableSyntaxParser(chunks => {
  assert(chunks.matchesPred(unit => unit.type == 'CODE_BLOCK'));
  const rawCodeBlock = chunks.accept() as Leaf;

  const lang = rawCodeBlock.getMetadata('lang');
  assert(typeof lang == 'string');

  return new CodeBlock(
    rawCodeBlock.position,
    lang || null,
    rawCodeBlock.contents.join('\n'),
  );
}, {});
