import {parserWithEnhancedErrors, SourceError} from '../err/SourceError';
import {Chunks} from '../pp/Chunk';
import {IPosition} from '../util/Position';
import {Block} from './block/Block';

export type Parser<B extends Block> = (chunks: Chunks) => B;
export type ParserAcceptingConfiguration<B extends Block> = (chunks: Chunks, cfg: Configuration) => B;

export type Configuration = { values: object; position: IPosition; } | null;
export type ConfigurationSchema<B extends Block> = {
  [key in keyof B]?: (val: any) => boolean;
};

export const configurableSyntaxParser = <B extends Block> (parser: Parser<B>, cfgSchema: ConfigurationSchema<B>): ParserAcceptingConfiguration<B> => {
  return parserWithEnhancedErrors((chunks, cfg) => {
    const result = parser(chunks);

    if (cfg != null) {
      Object.keys(cfg.values).forEach(key => {
        let val = cfg.values[key];
        let schema = cfgSchema[key];

        if (!schema) {
          throw new SourceError(`Configuration key "${key}" is not applicable`, cfg.position);
        }

        if (!schema(val)) {
          throw new SourceError(`Configuration value of key "${key}" is invalid`, cfg.position);
        }

        result[key] = val;
      });
    }

    return result;
  });
};
