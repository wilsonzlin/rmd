import {assert} from '../err/InternalError';
import {Segment} from '../parse/Segment';

export type TrieMatch<V> = {
  value: V;
  length: number;
} | null;

export class TrieNode<V> {
  readonly children: { [char: string]: TrieNode<V> } = {};
  leaf: V | null = null;

  add (entry: string, value: V): this {
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

  longestMatch (segment: Segment): TrieMatch<V> {
    let current: TrieNode<V> = this;
    let lastMatch: TrieMatch<V> = null;
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
