import {List, parseOrderedList, parseUnorderedList} from "./List";
import {Paragraph, parseParagraph} from "./Paragraph";
import {CodeBlock, parseCodeBlock} from "./CodeBlock";
import {Chunks} from "../../pp/Chunk";
import {Configuration} from "../Configuration";
import {SourceError} from "../../err/SourceError";
import {parseQuote, Quote} from "./Quote";
import {Dictionary, parseDictionary} from "./Dictionary";
import {parseHeading} from "../Heading";
import {assert, assertReason} from "../../err/InternalError";

export type Block = CodeBlock | Dictionary | List | Paragraph | Quote;

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
      assert(() => next.contents.length == 1);

      cfg = {
        values: JSON.parse(next.contents[0]),
        position: next.position,
      };

      // Don't set cfg to null as would otherwise happen at the end of this iteration.
      continue;
    }

    if (next.type == "SECTION_DELIMITER") {
      // TODO
      throw new Error("Unsupported");
    }

    const parser = {
      "UNORDERED_LIST_ITEM": parseUnorderedList,
      "ORDERED_LIST_ITEM": parseOrderedList,
      "QUOTE": parseQuote,
      "DEFINITION": parseDictionary,
      "PARAGRAPH": parseParagraph,
      "TABLE": parseParagraph,
      "CODE_BLOCK": parseCodeBlock,
      "HEADING": parseHeading,
    }[next.type];

    assertReason(parser, `Unknown chunk type "${next.type}"`);

    blocks.push(parser(chunks, cfg));

    cfg = null;
  }

  return blocks;
};
