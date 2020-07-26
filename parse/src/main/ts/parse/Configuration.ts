import {parserWithEnhancedErrors, SourceError} from '../err/SourceError';
import {Chunks} from '../pp/Chunk';
import {IPosition} from '../util/Position';
import {Block} from './block/Block';

export const ID_CHARS = /^[a-zA-Z0-9-_]+$/;
export const REF_CHARS = /^[a-zA-Z0-9-_]+$/;

export type Parser<B extends Block> = (chunks: Chunks) => B;
export type ParserAcceptingConfiguration<B extends Block> = (chunks: Chunks, cfg: Configuration) => B;

export type Configuration = { values: object; position: IPosition; } | null;
export type ConfigurationSchema<B extends Block> = {
  [key in keyof B]?: (val: unknown) => boolean;
};

export const configurableSyntaxParser = <B extends Block> (parser: Parser<B>, cfgSchema: ConfigurationSchema<B>): ParserAcceptingConfiguration<B> => {
  return parserWithEnhancedErrors((chunks, cfg) => {
    const result = parser(chunks);

    if (cfg != null) {
      Object.entries(cfg.values).forEach(([key, val]) => {
        // Some configuration keys are supported for all blocks.
        // Other keys are custom and are defined in `cfgSchema`.
        switch (key) {
        case 'id':
          if (!ID_CHARS.test(val)) {
            throw new SourceError(`Invalid ID: ${val}`, cfg.position);
          }
          break;

        case 'ref':
          if (!REF_CHARS.test(val)) {
            throw new SourceError(`Invalid ref: ${val}`, cfg.position);
          }
          break;

        default:
          const schema = cfgSchema[key];
          if (!schema) {
            throw new SourceError(`Configuration key "${key}" is not applicable`, cfg.position);
          }
          if (!schema(val)) {
            throw new SourceError(`Configuration value of key "${key}" is invalid`, cfg.position);
          }
          break;
        }

        result[key] = val;
      });
    }

    return result;
  });
};
