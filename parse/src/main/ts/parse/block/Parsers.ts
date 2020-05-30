import {ContainerType} from '../../pp/Container';
import {LeafType} from '../../pp/Leaf';
import {ParserAcceptingConfiguration} from '../Configuration';
import {Block} from './Block';

const BLOCK_PARSERS: { [type in ContainerType | LeafType]?: ParserAcceptingConfiguration<Block> } = {};

// Avoid cyclic dependency problems and invert the flow of creating `BLOCK_PARSERS`
// by getting parsers themselves to call this file's functions instead of importing
// them in this file.
export const registerBlockParser = (type: ContainerType | LeafType, parser: ParserAcceptingConfiguration<Block>) => {
  BLOCK_PARSERS[type] = parser;
};

export const getBlockParser = (type: ContainerType | LeafType) => {
  return BLOCK_PARSERS[type];
};
