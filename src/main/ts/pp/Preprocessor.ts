import {SourceError} from "../err/SourceError";
import {beginsWith, trimRight} from "../util/String";
import {Leaf, LeafType} from "./Leaf";
import {Container, ContainerType} from "./Container";
import {TextFilePosition} from "../util/IPosition";

export const preprocess = (name: string, code: string): Container => {
  const lines = code.split(/\r\n|\r|\n/).map(l => trimRight(l));

  const root = new Container({name: name, line: 1}, "DOCUMENT", null, "");
  let currentLevel: Container = root;
  let currentGroup: Leaf | null = null;
  let currentCodeBlockDelimiter: string | null = null;

  for (let [lineIdx, line] of lines.entries()) {
    const humanLineNo = lineIdx + 1;

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

    while (!beginsWith(line, currentLevel.indentation)) {
      // This loop always ends as root has zero length indentation, which always matches.
      currentLevel = currentLevel.parent!;
    }

    // Remove indentation.
    line = line.slice(currentLevel.indentation.length);

    // Currently in code block.
    if (currentCodeBlockDelimiter != null) {
      // Treat line literally after removing indentation.
      currentGroup!.add(line);
      if (line == currentCodeBlockDelimiter) {
        // End of code block.
        currentCodeBlockDelimiter = null;
        currentGroup = null;
      }
      continue;
    }

    const append = (type: LeafType, line: string): void => {
      if (currentGroup == null || currentGroup.type != type) {
        currentLevel.add(currentGroup = new Leaf({name: name, line: humanLineNo}, type));
      }
      currentGroup.add(line);
    };

    const singleton = (type: LeafType, line: string): void => {
      currentLevel.add(new Leaf({name: name, line: humanLineNo}, type).add(line));
      currentGroup = null;
    };

    const indent = (type: ContainerType, indentation: string): void => {
      currentLevel = new Container({name: name, line: humanLineNo}, type, currentLevel, indentation);
      currentLevel.parent!.add(currentLevel);
      currentGroup = null;
    };

    const error = (msg: string): SourceError => {
      return new SourceError(msg, new TextFilePosition(name, humanLineNo));
    };

    // Check if need to start new level (e.g. starting a new list, quote, or definition).
    switch (line[0]) {
    case "'":
    case "-":
      // List item.
      if (line[1] != " ") {
        throw error("List item must have space after `'` or `-`");
      }
      line = line.slice(2);
      // List items require exactly two additional spaces for continuation lines indentation.
      indent(line[0] == "'" ? "ORDERED_LIST_ITEM" : "UNORDERED_LIST_ITEM",
        `${currentLevel.indentation}  `);
      break;

    case ">":
      // Quote.
      if (line[1] != " ") {
        throw error("Quote lines must have space after `>`");
      }
      line = line.slice(2);
      indent("QUOTE", `${currentLevel.indentation}> `);
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
    if (/^\(.+\)$/.test(line)) {
      // Definition.
      singleton("DEFINITION_TITLE", line);

    } else if (/^{.+}$/.test(line)) {
      // Configuration.
      singleton("CONFIGURATION", line);

    } else if (/^``+/.test(line)) {
      // Code block.
      currentCodeBlockDelimiter = /^(`+)/.exec(line)![1];
      append("CODE_BLOCK", line);

    } else if (/^\|/.test(line)) {
      // Table
      append("TABLE", line);

    } else if (/^::+/.test(line)) {
      // Section.
      // Only allowed at the document level.
      if (!currentLevel.isRoot()) {
        throw error("Sections can only be at the document level");
      }
      singleton("SECTION_DELIMITER", line);

    } else if (/^#+/.test(line)) {
      // Heading.
      // Only allowed at the document level.
      if (!currentLevel.isRoot()) {
        throw error("Headings can only be at the document level");
      }
      singleton("HEADING", line);

    } else {
      // Paragraph.
      append("PARAGRAPH", line);
    }
  }

  return root;
};
