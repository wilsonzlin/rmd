import {Block} from "./Block";
import {configurableSyntaxParser} from "../Configuration";
import {Chunks} from "../../pp/Chunk";
import {Container} from "../../pp/Container";
import {parseRichText, RichText} from "../text/RichText";
import {Leaf} from "../../pp/Leaf";
import {TextPosition} from "../../util/Position";
import {Segment} from "../Segment";
import {parseBlocks} from "./Blocks";
import {assert} from "../../err/InternalError";

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

  while (!chunks.atEnd() && chunks.matchesPred(unit => unit.type == "DEFINITION")) {
    const rawDefinition = chunks.accept() as Container;
    const contents = new Chunks(rawDefinition.contents);

    assert(contents.matchesPred(unit => unit.type == "DEFINITION_TITLE"));
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
