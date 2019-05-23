import {Chunks} from "../../pp/Chunk";
import {Container} from "../../pp/Container";
import {Block, parseBlocks} from "./Block";
import {configurableSyntaxParser} from "../Configuration";

export type Quote = {
  contents: Block[];
};

export const parseQuote = configurableSyntaxParser(chunks => {
  // TODO Validation
  const rawQuote = chunks.accept() as Container;

  return {
    // TODO Validation
    contents: parseBlocks(new Chunks(rawQuote.contents)),
  };
}, {});
