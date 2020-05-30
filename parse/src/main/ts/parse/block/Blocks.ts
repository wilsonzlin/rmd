// This file's contents cannot go into Block.ts due to circular imports breaking subclasses of Block.

import {assert, assertReason} from '../../err/InternalError';
import {SourceError} from '../../err/SourceError';
import {Chunks} from '../../pp/Chunk';
import {Configuration} from '../Configuration';
import {Block} from './Block';
import {getBlockParser} from './Parsers';

export const parseBlocks = (chunks: Chunks): Block[] => {
  const blocks: Block[] = [];

  let cfg: Configuration = null;

  while (!chunks.atEnd()) {
    const next = chunks.peek();

    if (next.type == 'CONFIGURATION') {
      // There already exists an existing configuration that isn't before any block.
      if (cfg) {
        throw new SourceError('Unassociated configuration', cfg.position);
      }

      // Parse and assert the configuration chunk.
      chunks.skip();
      assert(next.contents.length == 1);

      // Already asserted that length == 1.
      const rawJson = next.contents[0];
      assert(rawJson[0] == '{');

      // Since configurations start with a brace, the parsed result must be an object.
      let parsed: object;
      try {
        parsed = JSON.parse(rawJson);
      } catch (err) {
        throw new SourceError(`Configuration is malformed: ${err.message}`, next.position);
      }

      cfg = {
        values: parsed,
        position: next.position,
      };

      // Don't set cfg to null as would otherwise happen at the end of this iteration.
      continue;
    }

    const parser = getBlockParser(next.type);

    assertReason(!!parser, `Unknown chunk type "${next.type}"`);

    // Already asserted that parser exists.
    blocks.push(parser!(chunks, cfg));

    cfg = null;
  }

  return blocks;
};
