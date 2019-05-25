import {TextPosition} from "../util/Position";

export type LeafType =
  "CONFIGURATION"
  | "PARAGRAPH"
  | "TABLE"
  | "CODE_BLOCK"
  | "DEFINITION_TITLE"
  | "SECTION_DELIMITER"
  | "HEADING";

export class Leaf {
  readonly position: TextPosition;
  readonly type: LeafType;
  readonly contents: string[];
  private readonly metadata: Map<string, any>;

  constructor (position: TextPosition, type: LeafType) {
    this.position = position;
    this.type = type;
    this.contents = [];
    this.metadata = new Map<string, any>();
  }

  add (line: string): this {
    this.contents.push(line);
    return this;
  }

  getMetadata (key: string): any | undefined {
    return this.metadata.get(key);
  }

  setMetadata (key: string, value: any): this {
    this.metadata.set(key, value);
    return this;
  }

  setMetadataPairs (...pairs: [string, any][]): this {
    for (const [key, value] of pairs) {
      this.metadata.set(key, value);
    }
    return this;
  }
}
