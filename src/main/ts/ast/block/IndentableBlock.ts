import {Code} from "../../Code";
import {List, Mode} from "./List";
import {Paragraph} from "./Paragraph";

export class IndentableBlock {
  static parseBlocks(code: Code, indentation: string): IndentableBlock[] {
    const blocks: IndentableBlock[] = [];

    if (code.matches("' ")) {
      blocks.push(List.parse(code, Mode.ORDERED, indentation));

    } else if (code.matches("- ")) {
      blocks.push(List.parse(code, Mode.UNORDERED, indentation));

    } else {
      blocks.push(Paragraph.parse(code, indentation));
    }

    return blocks;
  }
}
