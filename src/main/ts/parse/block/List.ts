import {Block, parseBlocks} from "./Block";
import {configurableSyntaxParser} from "../Configuration";
import {Chunks} from "../../pp/Chunk";
import {Container} from "../../pp/Container";

export enum Mode {
  ORDERED, UNORDERED
}

export type ListItem = {
  contents: Block[];
}

export type List = {
  mode: Mode;
  items: ListItem[];
}

const commonListConfigurationSchema = {};

const parseList = (chunks: Chunks, mode: Mode) => {
  // TODO Validation
  const chunkType = chunks.peek().type;
  const list: List = {mode: mode, items: []};

  do {
    // TODO Validation
    const rawItem = chunks.accept() as Container;

    // TODO Validation
    list.items.push({
      contents: parseBlocks(new Chunks(rawItem.contents)),
    });
    // TODO Validation
  } while (chunks.peek().type == chunkType);

  return list;
};

export const parseUnorderedList = configurableSyntaxParser(chunks => {
  return parseList(chunks, Mode.UNORDERED);
}, {
  ...commonListConfigurationSchema,
});

export const parseOrderedList = configurableSyntaxParser(chunks => {
  return parseList(chunks, Mode.ORDERED);
}, {
  ...commonListConfigurationSchema,
});
