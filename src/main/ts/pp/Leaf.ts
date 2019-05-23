import {TextFilePosition} from "../util/IPosition";

export type LeafType =
  "CONFIGURATION"
  | "PARAGRAPH"
  | "TABLE"
  | "CODE_BLOCK"
  | "DEFINITION_TITLE"
  | "SECTION_DELIMITER"
  | "HEADING";

export class Leaf {
  readonly position: TextFilePosition;
  readonly type: LeafType;
  readonly contents: string[];

  constructor (position: TextFilePosition, type: LeafType) {
    this.position = position;
    this.type = type;
    this.contents = [];
  }

  add (line: string): this {
    this.contents.push(line);
    return this;
  }
}
