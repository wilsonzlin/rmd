import {Block} from "./Block";
import {configurableSyntaxParser} from "../Configuration";
import {Chunks} from "../../pp/Chunk";
import {Container} from "../../pp/Container";
import {TextPosition} from "../../util/Position";
import {parseBlocks} from "./Blocks";

export enum Mode {
  ORDERED, UNORDERED
}

export type ListItem = {
  contents: Block[];
}

export class List extends Block {
  readonly mode: Mode;
  readonly items: ListItem[];

  constructor (position: TextPosition, mode: Mode, items: ListItem[]) {
    super(position);
    this.mode = mode;
    this.items = items;
  }
}

const commonListConfigurationSchema = {};

const parseList = (chunks: Chunks, mode: Mode) => {
  // TODO Validation
  const position = chunks.nextPosition();
  const chunkType = chunks.peek().type;
  const items: ListItem[] = [];

  do {
    // TODO Validation
    const rawItem = chunks.accept() as Container;

    // TODO Validation
    items.push({
      contents: parseBlocks(new Chunks(rawItem.contents)),
    });
    // TODO Validation
  } while (chunks.peek().type == chunkType);

  return new List(position, mode, items);
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
