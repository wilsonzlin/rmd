import {assert} from '../../err/InternalError';
import {Segment} from '../Segment';
import {MarkupAttributes} from './Markup';

const TAG_NAME_CHAR = /^[a-zA-Z-]$/;
const ATTR_NAME_CHAR = /^[a-zA-Z-]$/;
const NUMERIC_VALUE_CHAR = /^[0-9-.]$/;

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
  while (raw.peek() !== ']') {
    raw.skipWhile(c => /^\w$/.test(c));

    if (raw.peek() === '$') {
      // Self closing.
      selfClosing = true;
      break;
    }

    const attrName = raw.skipWhile(c => ATTR_NAME_CHAR.test(c)).join('');
    if (!attrName) {
      throw raw.constructSourceError('Invalid tag attribute name');
    }

    // If attribute has no value, then it's a boolean attribute.
    let value: boolean | number | string = true;
    if (raw.skipIf('=')) {
      if (NUMERIC_VALUE_CHAR.test(raw.peek())) {
        // Numeric value.
        value = Number.parseFloat(raw.skipWhile(c => NUMERIC_VALUE_CHAR.test(c)).join(''));
        if (!Number.isFinite(value)) {
          throw raw.constructSourceError('Invalid tag attribute value number');
        }
      } else if (raw.skipIf('"')) {
        // String value.
        value = raw.skipUntil(c => c === '"').join('');
        assert(raw.skip() === '"');
      } else {
        throw raw.constructSourceError('Invalid tag attribute value type');
      }
    }

    if (attributes.has(attrName)) {
      throw raw.constructSourceError('Duplicate attribute');
    }
    attributes.set(attrName, value);
  }
  assert(raw.skip() === ']');

  return {
    tagName,
    start,
    attributes,
    selfClosing,
  };
};
