import {configurableSyntaxParser} from "../Configuration";
import {Leaf} from "../../pp/Leaf";
import {Block} from "./Block";
import {TextPosition} from "../../util/Position";

export class CodeBlock extends Block {
  readonly lang: string;
  readonly data: string;

  constructor (position: TextPosition, lang: string, data: string) {
    super(position);
    this.lang = lang;
    this.data = data;
  }
}

export const parseCodeBlock = configurableSyntaxParser(chunks => {
  // TODO Validation
  const rawCodeBlock = chunks.accept() as Leaf;

  // TODO Validation
  const lang = rawCodeBlock.contents[0].replace(/^`+/, "");

  return new CodeBlock(
    rawCodeBlock.position,
    lang,
    // TODO Validation
    rawCodeBlock.contents.slice(1, -1).join("\n")
  );
}, {});
