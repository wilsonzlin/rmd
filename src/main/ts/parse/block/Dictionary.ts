import {Block} from "./Block";
import {configurableSyntaxParser} from "../Configuration";
import {Chunks} from "../../pp/Chunk";
import {Container} from "../../pp/Container";
import {parseRichText, RichText} from "../text/RichText";
import {Leaf} from "../../pp/Leaf";
import {TextPosition} from "../../util/Position";
import {Segment} from "../Segment";
import {parseBlocks} from "./Blocks";

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
  // TODO Validate
  const position = chunks.nextPosition();

  const definitions: Definition[] = [];

  do {
    // TODO Validation
    const rawDefinition = chunks.accept() as Container;
    const contents = new Chunks(rawDefinition.contents);

    // TODO Validation (including length)
    const rawTitle = contents.accept() as Leaf;

    const titleSegment = Segment.fromLeaf(rawTitle);

    titleSegment.requireUnit("(");
    // TODO Closing parenthesis

    // TODO Validation
    definitions.push({
      title: parseRichText(titleSegment),
      contents: parseBlocks(contents),
    });
    // TODO Validation
  } while (chunks.peek().type == "DEFINITION");

  return new Dictionary(position, definitions);
}, {});
