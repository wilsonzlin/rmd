import {Block} from "./block/Block";
import {SourceError} from "../err/SourceError";
import {Chunks} from "../pp/Chunk";
import {IPosition} from "../util/Position";

export type Parser<B extends Block> = (chunks: Chunks) => B;
export type ParserAcceptingConfiguration<B extends Block> = (chunks: Chunks, cfg: Configuration) => B;

export type Configuration = { values: object; position: IPosition; } | null;
export type ConfigurationSchema<B extends Block> = {
  [key in keyof B]?: (val: any) => val is B[key];
};

export const configurableSyntaxParser = <B extends Block> (parser: Parser<B>, cfgSchema: ConfigurationSchema<B>): ParserAcceptingConfiguration<B> => {
  return (chunks, cfg) => {
    const result = parser(chunks);

    if (cfg != null) {
      Object.keys(cfg.values).forEach(key => {
        let val = cfg.values[key];
        let schema = cfgSchema[key];

        if (!schema) {
          throw new SourceError(`Configuration key "${key}" is not applicable`, cfg.position);
        }

        if (!schema.validator(val)) {
          throw new SourceError(`Configuration value of key "${key}" is invalid`, cfg.position);
        }

        result[key] = val;
      });
    }

    return result;
  };
};
