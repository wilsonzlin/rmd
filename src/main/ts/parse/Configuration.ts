import {Block} from "./block/Block";
import {SourceError} from "../err/SourceError";
import {Chunks} from "../pp/Chunk";
import {IPosition} from "../util/IPosition";
import {Heading} from "./Heading";
import {Section} from "./Section";

export type Configurable = Block | Section | Heading;

export type Parser<S extends Configurable> = (chunks: Chunks) => S;
export type ParserAcceptingConfiguration<S extends Configurable> = (chunks: Chunks, cfg: Configuration) => S;

export type Configuration = { values: object; position: IPosition; } | null;
export type ConfigurationSchema<S extends Configurable> = {
  [key in keyof S]?: (val: any) => val is S[key];
};

export const configurableSyntaxParser = <S extends Configurable> (parser: Parser<S>, cfgSchema: ConfigurationSchema<S>): ParserAcceptingConfiguration<S> => {
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
