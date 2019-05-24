// This file's contents cannot go into Block.ts due to circular imports breaking subclasses of Block.

import {ContainerType} from "../../pp/Container";
import {LeafType} from "../../pp/Leaf";
import {Configuration, ParserAcceptingConfiguration} from "../Configuration";
import {parseCodeBlock} from "./CodeBlock";
import {parseDictionary} from "./Dictionary";
import {parseHeading} from "./Heading";
import {parseOrderedList, parseUnorderedList} from "./List";
import {parseParagraph} from "./Paragraph";
import {parseQuote} from "./Quote";
import {parseSection} from "./Section";
import {parseTable} from "./Table";
import {Chunks} from "../../pp/Chunk";
import {SourceError} from "../../err/SourceError";
import {assert, assertReason} from "../../err/InternalError";
import {Block} from "./Block";

const PARSERS: { [type in ContainerType | LeafType]?: ParserAcceptingConfiguration<Block> } = {
  "CODE_BLOCK": parseCodeBlock,
  "DEFINITION": parseDictionary,
  "HEADING": parseHeading,
  "ORDERED_LIST_ITEM": parseOrderedList,
  "PARAGRAPH": parseParagraph,
  "QUOTE": parseQuote,
  "SECTION_DELIMITER": parseSection,
  "TABLE": parseTable,
  "UNORDERED_LIST_ITEM": parseUnorderedList,
};

export const parseBlocks = (chunks: Chunks): Block[] => {
  const blocks: Block[] = [];

  let cfg: Configuration = null;

  while (!chunks.atEnd()) {
    const next = chunks.peek();

    if (next.type == "CONFIGURATION") {
      // There already exists an existing configuration that isn't before any block.
      if (cfg) {
        throw new SourceError("Unassociated configuration", cfg.position);
      }

      // Parse and assert the configuration chunk.
      chunks.skip();
      assert(next.contents.length == 1);

      cfg = {
        values: JSON.parse(next.contents[0]),
        position: next.position,
      };

      // Don't set cfg to null as would otherwise happen at the end of this iteration.
      continue;
    }

    const parser = PARSERS[next.type];

    assertReason(!!parser, `Unknown chunk type "${next.type}"`);

    // Already asserted that parser exists.
    blocks.push(parser!(chunks, cfg));

    cfg = null;
  }

  return blocks;
};
