import {Leaf} from "../../pp/Leaf";
import {parseRichText, RichText} from "../text/RichText";
import {configurableSyntaxParser} from "../Configuration";
import {Chunks} from "../../pp/Chunk";
import {Block} from "./Block";
import {TextPosition} from "../../util/Position";
import {Segment} from "../Segment";

export class Paragraph extends Block {
  readonly text: RichText;

  constructor (position: TextPosition, text: RichText) {
    super(position);
    this.text = text;
  }
}

export const parseParagraph = configurableSyntaxParser((chunks: Chunks): Paragraph => {
  // TODO Validation
  const raw = chunks.accept() as Leaf;

  return new Paragraph(raw.position, parseRichText(Segment.fromLeaf(raw)));
}, {});
