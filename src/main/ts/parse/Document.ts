import {Block} from "./block/Block";
import {Chunks} from "../pp/Chunk";
import {parseBlocks} from "./block/Blocks";

export type Document = {
  contents: Block[];
};

export const parseDocument = (chunks: Chunks): Document => {
  return {
    contents: parseBlocks(chunks),
  };
};
