import {IPosition} from "../util/Position";

export class SourceError extends Error {
  constructor (message: string, position: IPosition) {
    super(`${message} [${position.toString()}]`);
  }
}
