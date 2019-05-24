import {configurableSyntaxParser} from "../Configuration";
import {Leaf} from "../../pp/Leaf";
import {parseRichText, RichText} from "../text/RichText";
import {Block} from "./Block";
import {TextPosition} from "../../util/Position";
import {Segment} from "../Segment";

export class Heading extends Block {
  readonly level: number;
  readonly text: RichText;

  constructor (position: TextPosition, level: number, text: RichText) {
    super(position);
    this.level = level;
    this.text = text;
  }
}

export const parseHeading = configurableSyntaxParser(chunks => {
  // TODO Validation including length
  const raw = chunks.accept() as Leaf;

  const segment = Segment.fromLeaf(raw);

  let level = 0;
  while (segment.peek() == "#") {
    segment.skip();
    level++;
  }

  return new Heading(
    raw.position,
    level,
    // TODO Validation
    parseRichText(segment),
  );
}, {});
