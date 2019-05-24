import {Chunks} from "../../pp/Chunk";
import {Container} from "../../pp/Container";
import {Block} from "./Block";
import {configurableSyntaxParser} from "../Configuration";
import {TextPosition} from "../../util/Position";
import {parseBlocks} from "./Blocks";

export class Quote extends Block {
  readonly contents: Block[];

  constructor (position: TextPosition, contents: Block[]) {
    super(position);
    this.contents = contents;
  }
}

export const parseQuote = configurableSyntaxParser(chunks => {
  // TODO Validation
  const rawQuote = chunks.accept() as Container;

  return new Quote(
    rawQuote.position,
    // TODO Validation
    parseBlocks(new Chunks(rawQuote.contents))
  );
}, {});
