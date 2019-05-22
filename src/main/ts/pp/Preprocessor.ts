import {SourceError} from "../err/SourceError";
import {beginsWith} from "../util/String.js";
import {Block} from "./Block";

export const preprocess = (name: string, code: string): Block[] => {
  const lines = code.split(/\r\n?/).map(l => l.replace(/\s+$/, ""));

  let blocks: Block[] = [{
    indentation: "",
    blankPrefix: "",
    lines: [],
  }];
  let stack: Block[] = [blocks[0]];
  let current = stack[0];

  const indent = (indentation: string) => {
    const block = new Block(indentation);
    blocks.push(block);
    stack.push(block);
    current = block;
  };

  lines.forEach((line, lineNo) => {
    if (line == current.blankPrefix) {
      // Line break for formatting purposes; ignore.
      return;
    }

    while (!beginsWith(line, current.indentation)) {
      // Line does not begin with indentation. It could be malformed or end of the block.
      if (!(current = stack.pop())) {
        throw new SourceError("Invalid indentation", name, lineNo);
      }
    }

    // Remove indentation.
    line = line.slice(current.indentation.length);

    switch (line[0]) {
    case "'":
    case "-":
      // List item.
      if (line[1] != " ") {
        throw new SourceError("List item must have space padding", name, lineNo);
      }
      // List items require exactly two additional spaces for continuation lines indentation.
      indent(current.indentation + "  ");
      break;

    case ">":
      // Quote.
      if (line[1] != " ") {
        throw new SourceError("Quote lines must have space after chevron", name, lineNo);
      }
      indent(current.indentation + "> ");
      break;

    case "(":
      // Definition list definitions require exactly two additional spaces for continuation lines indentation.
      indent(current.indentation + "  ");
      break;

    case " ":
    case "\t":
    case "\v":
      // Line cannot start with whitespace.
      throw new SourceError("Line cannot start with whitespace after indentation", name, lineNo);

    default:
      current.lines.push(line);
    }
  });

  return blocks;
};
