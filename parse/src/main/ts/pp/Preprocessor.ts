import {assert} from '../err/InternalError';
import {SourceError} from '../err/SourceError';
import {TextPosition} from '../util/Position';
import {beginsWith, countCharRepetitionsAt, trimRight} from '../util/String';
import {Container, ContainerType} from './Container';
import {Leaf, LeafType} from './Leaf';

class LinesProcessor {
  readonly name: string;
  readonly root: Container;
  private readonly lines: string[];
  private current: number;
  private working: string;
  private leftRemovedAmount: number;

  private currentContainer: Container;
  private currentLeaf: Leaf | null;

  constructor (name: string, lines: string[]) {
    this.name = name;
    this.lines = lines;
    this.root = new Container({name: name, line: 1, col: 0}, 'DOCUMENT', null, '');

    this.currentContainer = this.root;
    this.currentLeaf = null;

    this.current = -1;
    this.working = '';
    this.leftRemovedAmount = 0;
  }

  /**
   * Has remaining lines.
   */
  hasNext (): boolean {
    return this.current < this.lines.length - 1;
  }

  /**
   * Work on the next line.
   */
  next (): boolean {
    if (!this.hasNext()) {
      return false;
    }
    this.current++;
    this.working = this.lines[this.current];
    this.leftRemovedAmount = 0;
    return true;
  }

  /**
   * Current container is the document/root/topmost-level.
   */
  currentlyDocument (): boolean {
    return this.currentContainer.isRoot();
  }

  /**
   * Get the first character of the current line.
   */
  firstChar (): string {
    return this.working[0];
  }

  /**
   * Get the second character of the current line.
   */
  secondChar (): string {
    return this.working[1];
  }

  /**
   * Get the last character of the current line.
   */
  lastChar (): string {
    return this.working[this.working.length - 1];
  }

  /**
   * Check if the current line begins with {@param query}.
   */
  beginsWith (query: string): boolean {
    return beginsWith(this.working, query);
  }

  /**
   * Check if the current line begins with the current container's indentation.
   */
  beginsWithIndentation (): boolean {
    return this.beginsWith(this.currentIndentation());
  }

  /**
   * Check how many {@param char} characters appear at the beginning of the current line.
   */
  beginningRepetitionsOf (char: string): number {
    return countCharRepetitionsAt(this.working, 0, char);
  }

  /**
   * Check if the current line equals {@param query}.
   */
  equals (query: string): boolean {
    return this.working == query;
  }

  /**
   * Check if the current line equals the current container's blank prefix.
   */
  equalsBlankPrefix (): boolean {
    return this.working === this.currentBlankPrefix();
  }

  /**
   * Get the current container's indentation.
   */
  currentIndentation (): string {
    return this.currentContainer.indentation;
  }

  /**
   * Get the current container's blank prefix.
   */
  currentBlankPrefix (): string {
    return this.currentContainer.blankPrefix;
  }

  /**
   * Leave the current container for its parent.
   */
  goToParentContainer (): this {
    this.currentContainer = this.currentContainer.parent!;
    assert(!!this.currentContainer);
    return this;
  }

  /**
   * Remove the first {@param amount} characters from the current line.
   */
  removeLeft (amount: number): this {
    this.working = this.working.slice(amount);
    this.leftRemovedAmount += amount;
    return this;
  }

  /**
   * Remove {@link currentIndentation} amount of characters from the beginning of the current line.
   */
  removeIndentation (): this {
    this.removeLeft(this.currentIndentation().length);
    return this;
  }

  /**
   * Remove the last {@param amount} characters from the current line.
   */
  removeRight (amount: number): this {
    this.working = this.working.slice(0, -amount);
    return this;
  }

  /**
   * Get a position representing the current source name, line, and column.
   * The column represents the amount of characters removed from the left of the line.
   * The line and column values are 1-based.
   */
  position (): TextPosition {
    return new TextPosition(this.name, this.current + 1, this.leftRemovedAmount + 1);
  }

  /**
   * Start a new leaf.
   */
  startLeaf (type: LeafType, ...metadata: [string, any][]): void {
    this.currentLeaf = new Leaf(this.position(), type).setMetadataPairs(...metadata);
    this.currentContainer.add(this.currentLeaf);
  }

  /**
   * End the current leaf.
   */
  endLeaf (): void {
    this.currentLeaf = null;
  }

  /**
   * Append the current line to the current leaf, starting a new leaf if it's not of type {@param type}.
   */
  startOrAppendLeaf (type: LeafType, ...metadata: [string, any][]): void {
    if (this.currentLeaf == null || this.currentLeaf.type != type) {
      this.startLeaf(type, ...metadata);
    }
    // start function always sets currentGroup.
    this.currentLeaf!.add(this.working);
  }

  /**
   * Starts a new leaf, append the current line to it, and then ends the leaf.
   * No leaf will be active immediately afterwards.
   */
  singletonLeaf (type: LeafType, ...metadata: [string, any][]): void {
    this.currentContainer.add(
      new Leaf(this.position(), type)
        .add(this.working)
        .setMetadataPairs(...metadata),
    );
    this.currentLeaf = null;
  }

  /**
   * Starts a new container, ending any current leaf.
   */
  newContainer (type: ContainerType, indentation: string): void {
    this.currentContainer = new Container(this.position(), type, this.currentContainer, indentation);
    this.currentContainer.parent!.add(this.currentContainer);
    this.currentLeaf = null;
  }

  /**
   * Construct a {@type SourceError} with the current position.
   */
  error (msg: string): SourceError {
    return new SourceError(msg, this.position());
  }

  /**
   * Get the current line.
   */
  get (): string {
    return this.working;
  }

  /**
   * Match the current line against {@param regex}.
   */
  regexMatches (regex: RegExp): RegExpExecArray | null {
    return regex.exec(this.working);
  }

  /**
   * Append a custom line to the current leaf.
   */
  appendLeafCustom (line: string): this {
    assert(!!this.currentLeaf);
    this.currentLeaf!.add(line);
    return this;
  }

  /**
   * Append the current line to the current leaf.
   */
  appendLeaf (): this {
    return this.appendLeafCustom(this.working);
  }
}

export const preprocess = (name: string, code: string): Container => {
  const lines = new LinesProcessor(name, code.split(/\r\n|\r|\n/).map(l => trimRight(l)));

  let currentCodeBlockDelimiter: string | null = null;

  while (lines.next()) {
    // It's possible for multiple levels to have the same blankPrefix. However, the highest
    // should be chosen, as it's possible to dedent but not indent.
    while (!lines.beginsWithIndentation() && !lines.equalsBlankPrefix()) {
      // This loop always ends as root has zero length indentation, which always matches.
      lines.goToParentContainer();
    }

    // This works because lines have been right-trimmed.
    if (lines.equalsBlankPrefix()) {
      // Line break for formatting purposes; ignore.
      if (currentCodeBlockDelimiter != null) {
        // Currently in code block, so add blank line.
        lines.appendLeafCustom('');
      } else {
        lines.endLeaf();
      }
      continue;
    }

    lines.removeIndentation();

    // Currently in code block.
    if (currentCodeBlockDelimiter != null) {
      // Treat line literally after removing indentation.
      // This is not the same as matchesAt, as the entire string (after indentation) needs to match, not just a substring.
      if (lines.equals(currentCodeBlockDelimiter)) {
        // End of code block.
        currentCodeBlockDelimiter = null;
        lines.endLeaf();
      } else {
        lines.appendLeaf();
      }
      continue;
    }

    // Check if need to start new level (e.g. starting a new list, quote, or definition).
    switch (lines.firstChar()) {
    case '\'':
    case '-':
      // List item.
      if (lines.secondChar() != ' ') {
        throw lines.error('List item must have space after `\'` or `-`');
      }
      // List items require exactly two additional spaces for continuation lines indentation.
      lines.newContainer(
        lines.firstChar() == '\'' ? 'ORDERED_LIST_ITEM' : 'UNORDERED_LIST_ITEM',
        `${lines.currentIndentation()}  `,
      );
      lines.removeLeft(2);
      break;

    case '>':
      // Quote.
      if (lines.secondChar() != ' ') {
        throw lines.error('Quote lines must have space after `>`');
      }
      lines.newContainer('QUOTE', `${lines.currentIndentation()}> `);
      lines.removeLeft(2);
      break;

    case '(':
      // Definition.
      // Definition title verification and unwrapping will be done by line processing later.
      // Definition list definitions require exactly two additional spaces for continuation lines indentation.
      lines.newContainer('DEFINITION', `${lines.currentIndentation()}  `);
      break;

    case ' ':
    case '\t':
    case '\f':
    case '\v':
      // Line cannot start with whitespace.
      throw lines.error('Line cannot start with whitespace after indentation');
    }

    // Process line.
    if (lines.firstChar() == '(') {
      // Definition.
      if (lines.lastChar() != ')') {
        throw lines.error('Definition titles must be a single line ending with a right parenthesis');
      }
      lines.removeLeft(1);
      lines.removeRight(1);
      lines.singletonLeaf('DEFINITION_TITLE');

    } else if (lines.firstChar() == '{') {
      // Configuration.
      lines.singletonLeaf('CONFIGURATION');

    } else if (lines.beginsWith('``')) {
      // Code block.
      currentCodeBlockDelimiter = '`'.repeat(lines.beginningRepetitionsOf('`'));
      const lang = lines.removeLeft(currentCodeBlockDelimiter.length).get().trim();
      lines.startLeaf('CODE_BLOCK', ['lang', lang]);

    } else if (lines.firstChar() == '|') {
      // Table
      lines.startOrAppendLeaf('TABLE');

    } else if (lines.beginsWith('::')) {
      // Section.
      // Only allowed at the document level.
      if (!lines.currentlyDocument()) {
        throw lines.error('Sections can only be at the document level');
      }
      const matches = lines.regexMatches(/^(:+) (begin|end) (.*)$/);
      if (!matches) {
        throw lines.error('Invalid section delimiter');
      }
      lines.singletonLeaf(
        'SECTION_DELIMITER',
        ['level', matches[1].length],
        ['mode', matches[2].toUpperCase()],
        ['type', matches[3].trim()],
      );

    } else if (lines.firstChar() == '#') {
      // Heading.
      // Only allowed at the document level.
      if (!lines.currentlyDocument()) {
        throw lines.error('Headings can only be at the document level');
      }
      lines.singletonLeaf('HEADING');

    } else {
      // Paragraph.
      lines.startOrAppendLeaf('PARAGRAPH');
    }
  }

  return lines.root;
};
