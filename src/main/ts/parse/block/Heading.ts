import {configurableSyntaxParser} from "../Configuration";
import {Leaf} from "../../pp/Leaf";
import {parseRichText, RichText} from "../text/RichText";
import {Block} from "./Block";
import {TextPosition} from "../../util/Position";
import {Segment} from "../Segment";
import {assert} from "../../err/InternalError";

export class Heading extends Block {
  readonly level: number;
  readonly text: RichText;
  readonly id?: string;

  constructor (position: TextPosition, level: number, text: RichText, id?: string) {
    super(position);
    this.level = level;
    this.text = text;
    this.id = id;
  }
}

export const parseHeading = configurableSyntaxParser<Heading>(chunks => {
  assert(chunks.matchesPred(unit => unit.type == "HEADING"));
  const raw = chunks.accept() as Leaf;
  assert(raw.contents.length == 1);

  const segment = Segment.fromLeaf(raw);

  let level = 0;
  while (segment.peek() == "#") {
    segment.skip();
    level++;
  }

  return new Heading(
    raw.position,
    level,
    parseRichText(segment),
  );
}, {
  id: val => typeof val == "string" && /^[a-zA-Z0-9-_]+$/.test(val),
});
