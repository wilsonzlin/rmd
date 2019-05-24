import {TextPosition} from "../../util/Position";

export abstract class Block {
  readonly position: TextPosition;

  protected constructor (position: TextPosition) {
    this.position = position;
  }
}
