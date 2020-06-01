import {assert} from '../../err/InternalError';
import {Segment} from '../Segment';
import {MarkupAttributes} from './Markup';

const TAG_NAME_CHAR = /^[a-zA-Z-]$/;
const ATTR_NAME_CHAR = /^[a-zA-Z-]$/;
const WHITESPACE_CHAR = /^\s$/;
const UNQUOTED_END_CHAR = /^[\s:\]]$/;

const parseUnquotedAttrVal = (raw: Segment): string => {
  const valueChars = [];
  let next;
  while (!UNQUOTED_END_CHAR.test(next = raw.peek())) {
    if (next === '\\') {
      raw.skip();
    }
    valueChars.push(raw.skip());
  }
  return valueChars.join('');
};

const parseQuotedAttrVal = (raw: Segment): string => {
  assert(raw.skip() === '"');
  const valueChars = [];
  let next;
  while ((next = raw.peek()) !== '"') {
    if (next === '\\') {
      raw.skip();
    }
    valueChars.push(raw.skip());
  }
  assert(raw.skip() === '"');
  return valueChars.join('');
};

export const parseTag = (raw: Segment): {
  tagName: string;
  start: number;
  attributes: MarkupAttributes;
  selfClosing: boolean;
} => {
  assert(raw.skip() === '[');
  const start = raw.lastCollectedMarker() + 1;

  const tagName = raw.skipWhile(c => TAG_NAME_CHAR.test(c)).join('');
  const attributes: MarkupAttributes = new Map();
  let selfClosing = false;
  while (true) {
    raw.skipWhile(c => WHITESPACE_CHAR.test(c));

    if (raw.peek() === ':') {
      break;
    }

    if (raw.peek() === ']') {
      // Self closing.
      selfClosing = true;
      break;
    }

    const attrName = raw.skipWhile(c => ATTR_NAME_CHAR.test(c)).join('');
    if (!attrName) {
      throw raw.constructSourceError('Invalid tag attribute name');
    }

    // If attribute has no value, then it's a boolean attribute.
    let value: boolean | string = true;
    if (raw.skipIf('=')) {
      if (raw.peek() === '"') {
        // Quoted value.
        value = parseQuotedAttrVal(raw);
      } else {
        // Unquoted value value.
        value = parseUnquotedAttrVal(raw);
      }
    }

    if (attributes.has(attrName)) {
      throw raw.constructSourceError('Duplicate attribute');
    }
    attributes.set(attrName, value);
  }
  if (selfClosing) {
    assert(raw.skip() === ']');
  } else {
    assert(raw.skip() === ':');
    // Skip any optional single whitespace character immediately after colon.
    if (WHITESPACE_CHAR.test(raw.peek())) {
      raw.skip();
    }
  }

  return {
    tagName,
    start,
    attributes,
    selfClosing,
  };
};
