import {IPosition} from "../util/IPosition";

export class SourceError extends Error {
  constructor (message: string, position: IPosition) {
    super(`${message} [${position.toString()}]`);
  }
}
