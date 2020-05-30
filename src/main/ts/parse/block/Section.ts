import {assert} from '../../err/InternalError';
import {parserWithEnhancedErrors} from '../../err/SourceError';
import {Chunk, Chunks} from '../../pp/Chunk';
import {Leaf} from '../../pp/Leaf';
import {TextPosition} from '../../util/Position';
import {Configuration} from '../Configuration';
import {Block} from './Block';
import {parseBlocks} from './Blocks';

export class Section extends Block {
  readonly type: string;
  readonly config: Configuration;
  readonly contents: Block[];

  constructor (position: TextPosition, type: string, config: Configuration, contents: Block[]) {
    super(position);
    this.type = type;
    this.config = config;
    this.contents = contents;
  }
}

class Delimiter {
  readonly level: number;
  readonly mode: 'BEGIN' | 'END';
  readonly type: string;

  constructor (level: number, mode: 'BEGIN' | 'END', type: string) {
    this.level = level;
    this.mode = mode;
    this.type = type;
  }

  isEndOf (other: Delimiter): boolean {
    return this.mode == 'BEGIN' &&
      other.mode == 'END' &&
      this.level == other.level &&
      this.type == other.type;
  }
}

const parseDelimiter = (delimiter: Leaf): Delimiter => {
  assert(delimiter.type == 'SECTION_DELIMITER' && delimiter.contents.length == 1);

  const mode = delimiter.getMetadata('mode');
  assert(mode === 'START' || mode === 'END');
  const type = delimiter.getMetadata('type');
  assert(typeof type == 'string');
  const level = delimiter.getMetadata('level');
  assert(typeof level == 'number');

  return new Delimiter(level, mode, type);
};

export const parseSection = parserWithEnhancedErrors((chunks: Chunks, cfg: Configuration): Section => {
  assert(chunks.matchesPred(unit => unit.type == 'SECTION_DELIMITER'));
  const rawDelimiter = chunks.accept() as Leaf;

  const rawSection: Chunk[] = [];

  const delimiter = parseDelimiter(rawDelimiter);

  while (!chunks.atEnd()) {
    const chunk = chunks.accept();
    if (chunk.type == 'SECTION_DELIMITER' && parseDelimiter(chunk).isEndOf(delimiter)) {
      break;
    }
    rawSection.push(chunk);
  }

  return new Section(
    rawDelimiter.position,
    delimiter.type,
    cfg,
    parseBlocks(new Chunks(rawSection)),
  );
});
