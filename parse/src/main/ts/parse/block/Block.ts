import {TextPosition} from '../../util/Position';

export abstract class Block {
  // This will be set (if defined in document) by any config supported block parser.
  readonly id?: string;
  // This will be set (if defined in document) by any config supported block parser.
  readonly ref?: string;
  readonly position: TextPosition;

  protected constructor (position: TextPosition) {
    this.position = position;
  }
}
