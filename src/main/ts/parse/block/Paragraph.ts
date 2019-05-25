import {Leaf} from "../../pp/Leaf";
import {parseRichText, RichText} from "../text/RichText";
import {configurableSyntaxParser} from "../Configuration";
import {Chunks} from "../../pp/Chunk";
import {Block} from "./Block";
import {TextPosition} from "../../util/Position";
import {Segment} from "../Segment";
import {assert} from "../../err/InternalError";

export class Paragraph extends Block {
  readonly text: RichText;

  constructor (position: TextPosition, text: RichText) {
    super(position);
    this.text = text;
  }
}

export const parseParagraph = configurableSyntaxParser((chunks: Chunks): Paragraph => {
  assert(chunks.matchesPred(unit => unit.type == "PARAGRAPH"));
  const raw = chunks.accept() as Leaf;

  return new Paragraph(raw.position, parseRichText(Segment.fromLeaf(raw)));
}, {});
