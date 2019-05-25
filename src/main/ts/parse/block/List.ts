import {Block} from "./Block";
import {configurableSyntaxParser} from "../Configuration";
import {Chunks} from "../../pp/Chunk";
import {Container} from "../../pp/Container";
import {TextPosition} from "../../util/Position";
import {parseBlocks} from "./Blocks";
import {assert} from "../../err/InternalError";

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
  const position = chunks.nextPosition();

  const chunkType = chunks.peek().type;
  assert(chunkType == "UNORDERED_LIST_ITEM" || chunkType == "ORDERED_LIST_ITEM");

  const items: ListItem[] = [];

  while (!chunks.atEnd() && chunks.matchesPred(u => u.type == chunkType)) {
    const rawItem = chunks.accept() as Container;

    items.push({
      contents: parseBlocks(new Chunks(rawItem.contents)),
    });
  }

  // This function should only be called upon visiting a list item,
  // so there should be at least one item.
  assert(items.length > 0);

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
