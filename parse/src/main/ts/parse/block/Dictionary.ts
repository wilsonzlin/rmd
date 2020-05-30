import {assert} from '../../err/InternalError';
import {Chunks} from '../../pp/Chunk';
import {Container} from '../../pp/Container';
import {Leaf} from '../../pp/Leaf';
import {TextPosition} from '../../util/Position';
import {configurableSyntaxParser} from '../Configuration';
import {Segment} from '../Segment';
import {parseRichText, RichText} from '../text/RichText';
import {Block} from './Block';
import {parseBlocks} from './Blocks';

export type Definition = {
  title: RichText;
  contents: Block[];
};

export class Dictionary extends Block {
  readonly definitions: Definition[];

  constructor (position: TextPosition, definitions: Definition[]) {
    super(position);
    this.definitions = definitions;
  }
}

export const parseDictionary = configurableSyntaxParser(chunks => {
  const position = chunks.nextPosition();

  const definitions: Definition[] = [];

  while (!chunks.atEnd() && chunks.matchesPred(unit => unit.type == 'DEFINITION')) {
    const rawDefinition = chunks.accept() as Container;
    const contents = new Chunks(rawDefinition.contents);

    assert(contents.matchesPred(unit => unit.type == 'DEFINITION_TITLE'));
    const rawTitle = contents.accept() as Leaf;
    assert(rawTitle.contents.length == 1);

    const titleSegment = Segment.fromLeaf(rawTitle);

    definitions.push({
      title: parseRichText(titleSegment),
      contents: parseBlocks(contents),
    });
  }

  // This function should only be called upon visiting a definition title,
  // so there should be at least one definition.
  assert(definitions.length > 0);

  return new Dictionary(position, definitions);
}, {});
