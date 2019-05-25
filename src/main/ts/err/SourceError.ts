import {IPosition} from "../util/Position";
import {ParserAcceptingConfiguration} from "../parse/Configuration";
import {Block} from "../parse/block/Block";

export class SourceError extends Error {
  constructor (message: string, position: IPosition) {
    super(`${message} [${position.toString()}]`);
  }

  addPosition (pos: IPosition): this {
    this.message += `\n  > at ${pos}`;
    return this;
  }
}

export const parserWithEnhancedErrors = <B extends Block> (parser: ParserAcceptingConfiguration<B>): ParserAcceptingConfiguration<B> => {
  return (chunks, cfg) => {
    const position = chunks.nextPosition();
    try {
      return parser(chunks, cfg);
    } catch (e) {
      if (e instanceof SourceError) {
        e.addPosition(position);
      }
      throw e;
    }
  };
};
