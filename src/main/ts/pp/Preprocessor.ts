import {SourceError} from "../err/SourceError";
import {beginsWith, countCharRepetitionsAt, matchesAt, trimRight} from "../util/String";
import {Leaf, LeafType} from "./Leaf";
import {Container, ContainerType} from "./Container";
import {TextPosition} from "../util/Position";

export const preprocess = (name: string, code: string): Container => {
  const lines = code.split(/\r\n|\r|\n/).map(l => trimRight(l));

  const root = new Container({name: name, line: 1, col: 0}, "DOCUMENT", null, "");
  let currentLevel: Container = root;
  let currentGroup: Leaf | null = null;
  let currentCodeBlockDelimiter: string | null = null;

  for (const [lineIdx, line] of lines.entries()) {
    const position = (): TextPosition => {
      return new TextPosition(name, lineIdx + 1, colIdx + 1);
    };

    const lineAfterCol = (): string => {
      return line.slice(colIdx);
    };

    const append = (type: LeafType): void => {
      if (currentGroup == null || currentGroup.type != type) {
        currentLevel.add(currentGroup = new Leaf(position(), type));
      }
      currentGroup.add(lineAfterCol());
    };

    const singleton = (type: LeafType): void => {
      currentLevel.add(new Leaf(position(), type).add(lineAfterCol()));
      currentGroup = null;
    };

    const indent = (type: ContainerType, indentation: string): void => {
      currentLevel = new Container(position(), type, currentLevel, indentation);
      currentLevel.parent!.add(currentLevel);
      currentGroup = null;
    };

    const error = (msg: string): SourceError => {
      return new SourceError(msg, position());
    };

    // It's possible for multiple levels to have the same blankPrefix. However, the highest
    // should be chosen, as it's possible to dedent but not indent.
    while (!beginsWith(line, currentLevel.indentation) && line != currentLevel.blankPrefix) {
      // This loop always ends as root has zero length indentation, which always matches.
      currentLevel = currentLevel.parent!;
    }

    // This works because lines have been right-trimmed.
    if (line == currentLevel.blankPrefix) {
      // Line break for formatting purposes; ignore.
      if (currentCodeBlockDelimiter != null) {
        // Currently in code block, so add blank line.
        currentGroup!.add("");
      } else {
        currentGroup = null;
      }
      continue;
    }

    // Remove indentation.
    let colIdx = currentLevel.indentation.length;

    // Currently in code block.
    if (currentCodeBlockDelimiter != null) {
      // Treat line literally after removing indentation.
      currentGroup!.add(lineAfterCol());
      if (matchesAt(line, colIdx, currentCodeBlockDelimiter)) {
        // End of code block.
        currentCodeBlockDelimiter = null;
        currentGroup = null;
      }
      continue;
    }

    // Check if need to start new level (e.g. starting a new list, quote, or definition).
    switch (line[colIdx]) {
    case "'":
    case "-":
      // List item.
      if (line[colIdx + 1] != " ") {
        throw error("List item must have space after `'` or `-`");
      }
      // List items require exactly two additional spaces for continuation lines indentation.
      indent(line[colIdx] == "'" ? "ORDERED_LIST_ITEM" : "UNORDERED_LIST_ITEM",
        `${currentLevel.indentation}  `);
      colIdx += 2;
      break;

    case ">":
      // Quote.
      if (line[colIdx + 1] != " ") {
        throw error("Quote lines must have space after `>`");
      }
      indent("QUOTE", `${currentLevel.indentation}> `);
      colIdx += 2;
      break;

    case "(":
      // Definition.
      // Definition title verification and unwrapping will be done by line processing later.
      // Definition list definitions require exactly two additional spaces for continuation lines indentation.
      indent("DEFINITION", `${currentLevel.indentation}  `);
      break;

    case " ":
    case "\t":
    case "\f":
    case "\v":
      // Line cannot start with whitespace.
      throw error("Line cannot start with whitespace after indentation");
    }

    // Process line.
    if (line[colIdx] == "(") {
      // Definition.
      singleton("DEFINITION_TITLE");

    } else if (line[colIdx] == "{") {
      // Configuration.
      singleton("CONFIGURATION");

    } else if (matchesAt(line, colIdx, "``")) {
      // Code block.
      currentCodeBlockDelimiter = "`".repeat(countCharRepetitionsAt(line, colIdx, "`"));
      append("CODE_BLOCK");

    } else if (line[colIdx] == "|") {
      // Table
      append("TABLE");

    } else if (matchesAt(line, colIdx, "::")) {
      // Section.
      // Only allowed at the document level.
      if (!currentLevel.isRoot()) {
        throw error("Sections can only be at the document level");
      }
      singleton("SECTION_DELIMITER");

    } else if (line[colIdx] == "#") {
      // Heading.
      // Only allowed at the document level.
      if (!currentLevel.isRoot()) {
        throw error("Headings can only be at the document level");
      }
      singleton("HEADING");

    } else {
      // Paragraph.
      append("PARAGRAPH");
    }
  }

  return root;
};
