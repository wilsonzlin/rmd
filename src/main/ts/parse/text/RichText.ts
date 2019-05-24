import {Segment} from "../Segment";
import {assert} from "../../err/InternalError";

export type MarkupType =
  "STRONG" |
  "EMPHASIS" |
  "STRIKETHROUGH" |
  "UNDERLINE" |

  "CODE" |

  "LINK_HEADING" |
  "LINK_ANCHOR" |
  "LINK_FOOTNOTE" |
  "LINK_ARTICLE" |
  "LINK_EMAIL" |
  "LINK_EXTERNAL";

const FORMATTING_MARKUP = new Set([
  "STRONG",
  "EMPHASIS",
  "STRIKETHROUGH",
  "UNDERLINE",
]);
const DATA_MARKUP = new Set([
  "CODE",
  "LINK_HEADING",
  "LINK_ANCHOR",
  "LINK_FOOTNOTE",
  "LINK_ARTICLE",
  "LINK_EMAIL",
  "LINK_EXTERNAL",
]);

export interface Markup {
  type: MarkupType,
  start: number;
  end: number;
}

export interface LinkMarkup extends Markup {
  type: "LINK_HEADING" | "LINK_ANCHOR" | "LINK_FOOTNOTE" | "LINK_ARTICLE" | "LINK_EMAIL" | "LINK_EXTERNAL";
  target: string;
  tip: string | null;
  label: string | null;
}

export type RichText = {
  raw: string;
  markup: Markup[];
}

const CODE_DELIMITERS = new Set(["^", "`"]);

function parseCode (raw: Segment): Markup {
  let delim = raw.skip();
  assert(CODE_DELIMITERS.has(delim));

  while (raw.skipIf(delim[0])) {
    delim += delim[0];
  }

  const start = raw.collectedMarker() + 1;
  let data = "";
  while (!raw.matches(delim)) {
    data += raw.accept();
  }
  const end = raw.collectedMarker();

  raw.requireSequence(delim, "Inline code delimiter");

  return {
    type: "CODE",
    start, end,
  };
}

type TrieMatch = {
  value: MarkupType;
  length: number;
} | null;

class TrieNode {
  readonly children: { [char: string]: TrieNode } = {};
  leaf: MarkupType | null = null;

  add (entry: string, value: MarkupType): this {
    if (!entry) {
      assert(this.leaf == null);
      this.leaf = value;
    } else {
      const char = entry[0];
      this.children[char] = this.children[char] || new TrieNode();
      this.children[char].add(entry.slice(1), value);
    }
    return this;
  }

  longestMatch (segment: Segment): TrieMatch {
    let current: TrieNode = this;
    let lastMatch: TrieMatch = null;
    for (let offset = 0; segment.hasRemaining(offset + 1); offset++) {
      current = current.children[segment.peekOffset(offset)];
      if (!current) {
        break;
      }
      if (current.leaf != null) {
        lastMatch = {length: offset + 1, value: current.leaf};
      }
    }
    return lastMatch;
  }
}

const FORMATTING_TRIE = new TrieNode()
  .add("**", "STRONG")
  .add("*", "EMPHASIS")
  .add("~", "STRIKETHROUGH")
  .add("_", "UNDERLINE");

class FormattingStack {
  private readonly stack: Markup[] = [];

  isEmpty (): boolean {
    return !this.stack.length;
  }

  lastType (): MarkupType | null {
    if (this.isEmpty()) {
      return null;
    }
    return this.stack[this.stack.length - 1].type;
  }

  hasType (type: MarkupType): boolean {
    return this.stack.some(f => f.type == type);
  }

  push (type: MarkupType, start: number): this {
    // -1 is a valid end value.
    this.stack.push({type, start, end: -2});
    return this;
  }

  pop (): Markup {
    assert(!this.isEmpty());
    return this.stack.pop()!;
  }
}

export const parseRichText = (raw: Segment): RichText => {
  const markup: Markup[] = [];

  const formattingStack = new FormattingStack();
  while (!raw.atEnd()) {
    const next = raw.peek();

    const formattingMarkup = FORMATTING_TRIE.longestMatch(raw);
    if (formattingMarkup != null) {
      if (formattingStack.lastType() == formattingMarkup.value) {
        markup.push({
          ...formattingStack.pop(),
          end: raw.collectedMarker(),
        });

      } else if (formattingStack.hasType(formattingMarkup.value)) {
        throw raw.constructSourceError("Can't nest or overlap formatting of the same type");

      } else {
        formattingStack.push(formattingMarkup.value, raw.collectedMarker() + 1);
      }

      raw.skipAmount(formattingMarkup.length);
      continue;
    }

    if (CODE_DELIMITERS.has(next)) {
      markup.push(parseCode(raw));
      continue;
    }

    if (next == "[") {
      // Tag.
      // TODO
      continue;
    }

    // Regular character.
    if (next == "\\") {
      raw.skip();
    }
    raw.accept();
  }

  if (!formattingStack.isEmpty()) {
    throw raw.constructSourceError(`No matching ${formattingStack.pop().type}`);
  }

  const accepted = raw.collected();

  return {
    raw: accepted.join(""),
    markup: markup,
  };
};
