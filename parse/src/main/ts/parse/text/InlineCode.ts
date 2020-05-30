import {assert} from '../../err/InternalError';
import {Segment} from '../Segment';
import {Markup} from './Markup';

// Two options available in case we want to use the other one literally.
export const CODE_DELIMITERS = new Set(['^', '`']);

export const parseCode = (raw: Segment): Markup => {
  const delimiterChar = raw.peek();
  assert(CODE_DELIMITERS.has(delimiterChar));
  const delimiter = raw.skipWhile(c => c === delimiterChar).join('');

  const start = raw.lastCollectedMarker() + 1;
  while (!raw.matchesSequence(delimiter)) {
    raw.accept();
  }
  const end = raw.lastCollectedMarker();

  raw.requireSkipSequence(delimiter, 'Inline code delimiter');

  return new Markup('CODE', start, end, new Map());
};
