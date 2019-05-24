import {RichText} from "../text/RichText";
import {configurableSyntaxParser} from "../Configuration";
import {Block} from "./Block";
import {TextPosition} from "../../util/Position";

export type Cell = {
  text: RichText;
};

export type Row = {
  cells: Cell[];
};

export class Table extends Block {
  readonly headings: Row[];
  readonly body: Row[];

  constructor (position: TextPosition, headings: Row[], body: Row[]) {
    super(position);
    this.headings = headings;
    this.body = body;
  }
}

export const parseTable = configurableSyntaxParser(chunks => {
  // TODO Validate
  const position = chunks.nextPosition();

  // TODO
  const headings: Row[] = [];
  const body: Row[] = [];

  // TODO
  return new Table(
    position,
    headings,
    body
  );
}, {});
