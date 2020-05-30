import {assert} from '../../err/InternalError';
import {Stack} from '../../util/Stack';
import {TrieNode} from '../../util/Trie';
import {Segment} from '../Segment';
import {parseCode} from './InlineCode';
import {Markup, MarkupAttributes} from './Markup';
import {parseTag} from './Tag';

export type RichText = {
  raw: string;
  markup: Markup[];
}

const enum MarkupToken {
  BOLD,
  ITALIC,
  STRIKETHROUGH,
  UNDERLINE,
  OPENING_TAG,
  CLOSING_TAG,
  CODE,
}

const TOKEN_AS_TYPE = {
  [MarkupToken.BOLD]: 'b',
  [MarkupToken.ITALIC]: 'i',
  [MarkupToken.STRIKETHROUGH]: 's',
  [MarkupToken.UNDERLINE]: 'u',
};

const SYNTAX_TRIE = new TrieNode<MarkupToken>()
  .add('**', MarkupToken.BOLD)
  .add('*', MarkupToken.ITALIC)
  .add('~', MarkupToken.STRIKETHROUGH)
  .add('_', MarkupToken.UNDERLINE)
  .add('[', MarkupToken.OPENING_TAG)
  .add('[$]', MarkupToken.CLOSING_TAG)
  .add('^', MarkupToken.CODE)
  .add('$', MarkupToken.CODE);

export const parseRichText = (raw: Segment, breakChars: string = ''): RichText => {
  const markup: Markup[] = [];
  const stack = new Stack<{
    token: MarkupToken,
    type: string,
    start: number,
    attributes: MarkupAttributes,
  }>();

  while (!raw.atEnd()) {
    if (breakChars.includes(raw.peek())) {
      break;
    }

    const token = SYNTAX_TRIE.longestMatch(raw);
    if (token === null) {
      // Regular character.
      if (raw.peek() == '\\') {
        raw.skip();
      }
      raw.accept();
      continue;
    }

    switch (token.value) {
    case MarkupToken.BOLD:
    case MarkupToken.ITALIC:
    case MarkupToken.STRIKETHROUGH:
    case MarkupToken.UNDERLINE:
      if (stack.last()?.token === token.value) {
        const last = stack.pop();
        markup.push(new Markup(last.type, last.start, raw.lastCollectedMarker(), last.attributes));
      } else if (stack.some(p => p.token === token!.value)) {
        throw raw.constructSourceError('Cannot nest or overlap formatting of the same type');
      } else {
        stack.push({
          token: token.value,
          type: TOKEN_AS_TYPE[token.value],
          start: raw.lastCollectedMarker() + 1,
          attributes: new Map(),
        });
      }
      raw.skipAmount(token.length);
      break;

    case MarkupToken.OPENING_TAG:
      const tag = parseTag(raw);
      if (tag.selfClosing) {
        markup.push(new Markup(
          tag.tagName,
          tag.start,
          tag.start,
          tag.attributes,
        ));
      } else {
        stack.push({
          token: token.value,
          type: tag.tagName,
          start: tag.start,
          attributes: tag.attributes,
        });
      }
      break;

    case MarkupToken.CLOSING_TAG:
      if (stack.last()?.token !== MarkupToken.OPENING_TAG) {
        throw raw.constructSourceError('Closing tag does not match with opening tag');
      }
      const last = stack.pop();
      markup.push(new Markup(last.type, last.start, raw.lastCollectedMarker(), last.attributes));
      break;

    case MarkupToken.CODE:
      markup.push(parseCode(raw));
      break;

    default:
      assert(false);
    }
  }

  if (!stack.isEmpty()) {
    throw raw.constructSourceError(`No matching ${stack.pop().type}`);
  }

  const accepted = raw.collected();

  return {
    raw: accepted.join(''),
    markup: markup,
  };
};