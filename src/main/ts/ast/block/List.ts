import {Code} from "../../Code";
import {IndentableBlock} from "./IndentableBlock";

export enum Mode {
  ORDERED, UNORDERED
}

export class ListItem {
  content: IndentableBlock[];
}

export class List extends IndentableBlock {
  mode: Mode;
  items: ListItem[];

  /**
   * The next characters must be either `- ` or `' `, depending on {@param mode}.
   *
   * @param code code
   * @param mode whether the list is ordered or not.
   * @param indentation What any subsequent line must begin with, not including the list's own item indentation requirements.
   */
  static parse (code: Code, mode: Mode, indentation: string): List {
    const items: ListItem[] = [];

    const starter = mode == Mode.ORDERED ? "' " : "- ";
    code.require(starter, "list item starter");
    while (true) {
      if (code.isLineTerminator()) {
        if (!code.skipIfMatches(`${indentation}${starter}`)) {
          // Not a continuation line.
          break;
        }
      } else {
        // Lines that are part of a list item after the first must be further indented with exactly two spaces.
        items.push({content: IndentableBlock.parseBlocks(code, indentation + "  ")});
      }
    }

    return {mode, items};
  }
}
