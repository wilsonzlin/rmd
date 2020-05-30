import {Chunks} from '../pp/Chunk';
import {Block} from './block/Block';
import {parseBlocks} from './block/Blocks';

export type Document = {
  contents: Block[];
};

export const parseDocument = (chunks: Chunks): Document => {
  return {
    contents: parseBlocks(chunks),
  };
};
