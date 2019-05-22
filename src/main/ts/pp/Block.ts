import {trimRight} from "../util/String.js";

export class Block {
  readonly indentation: string;
  readonly blankPrefix: string;
  readonly lines: string[];

  constructor (indentation: string) {
    this.indentation = indentation;
    this.blankPrefix = trimRight(indentation);
    this.lines = [];
  }
}
