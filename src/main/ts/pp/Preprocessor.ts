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
      return line.slice(colIdx, line.length - rightTrimAmount);
    };

    const start = (type: LeafType, ...metadata: [string, any][]): void => {
      currentGroup = new Leaf(position(), type).setMetadataPairs(...metadata);
      currentLevel.add(currentGroup);
    };

    const append = (type: LeafType, ...metadata: [string, any][]): void => {
      if (currentGroup == null || currentGroup.type != type) {
        start(type, ...metadata);
      }
      // start function always sets currentGroup.
      currentGroup!.add(lineAfterCol());
    };

    const singleton = (type: LeafType, ...metadata: [string, any][]): void => {
      currentLevel.add(
        new Leaf(position(), type)
          .add(lineAfterCol())
          .setMetadataPairs(...metadata)
      );
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
    // Amount of characters to remove from end of line.
    let rightTrimAmount = 0;

    // Currently in code block.
    if (currentCodeBlockDelimiter != null) {
      // Treat line literally after removing indentation.
      const subline = lineAfterCol();
      // This is not the same as matchesAt, as the entire string (after indentation) needs to match, not just a substring.
      if (subline == currentCodeBlockDelimiter) {
        // End of code block.
        currentCodeBlockDelimiter = null;
        currentGroup = null;
      } else {
        currentGroup!.add(subline);
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
      if (line[line.length - 1] != ")") {
        throw error("Definition titles must be a single line ending with a right parenthesis");
      }
      colIdx++;
      rightTrimAmount++;
      singleton("DEFINITION_TITLE");

    } else if (line[colIdx] == "{") {
      // Configuration.
      singleton("CONFIGURATION");

    } else if (matchesAt(line, colIdx, "``")) {
      // Code block.
      currentCodeBlockDelimiter = "`".repeat(countCharRepetitionsAt(line, colIdx, "`"));
      const lang = line.slice(colIdx + currentCodeBlockDelimiter.length).trim();
      start("CODE_BLOCK", ["lang", lang]);

    } else if (line[colIdx] == "|") {
      // Table
      append("TABLE");

    } else if (matchesAt(line, colIdx, "::")) {
      // Section.
      // Only allowed at the document level.
      if (!currentLevel.isRoot()) {
        throw error("Sections can only be at the document level");
      }
      const matches = /^(:+) (begin|end) (.*)$/.exec(lineAfterCol());
      if (!matches) {
        throw error("Invalid section delimiter");
      }
      singleton(
        "SECTION_DELIMITER",
        ["level", matches[1].length],
        ["mode", matches[2].toUpperCase()],
        ["type", matches[3].trim()]
      );

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
