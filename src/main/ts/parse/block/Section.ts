import {Block} from "./Block";
import {Chunk, Chunks} from "../../pp/Chunk";
import {Configuration} from "../Configuration";
import {Leaf} from "../../pp/Leaf";
import {TextPosition} from "../../util/Position";
import {parseBlocks} from "./Blocks";

export class Section extends Block {
  readonly config: Configuration;
  readonly contents: Block[];

  constructor (position: TextPosition, config: Configuration, contents: Block[]) {
    super(position);
    this.config = config;
    this.contents = contents;
  }
}

const parseDelimiter = (delimiter: Leaf): string => {
  // TODO Validation
  return (delimiter as Leaf).contents[0].replace(/^:+/, "");
};

export const parseSection = (chunks: Chunks, cfg: Configuration): Section => {
  // TODO Validate
  const position = chunks.nextPosition();

  const rawSection: Chunk[] = [];

  // TODO Validation
  const delimiter = parseDelimiter(chunks.accept() as Leaf);
  const endDelimiter = `end${delimiter}`;

  while (!chunks.atEnd()) {
    const chunk = chunks.accept();
    if (chunk.type == "SECTION_DELIMITER" && parseDelimiter(chunk) == endDelimiter) {
      break;
    }
    rawSection.push(chunk);
  }

  return new Section(
    position,
    cfg,
    parseBlocks(new Chunks(rawSection))
  );
};
