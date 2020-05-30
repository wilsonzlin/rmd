import {TextPosition} from '../util/Position';
import {trimRight} from '../util/String';
import {Chunk} from './Chunk';

export type ContainerType = 'DOCUMENT' | 'UNORDERED_LIST_ITEM' | 'ORDERED_LIST_ITEM' | 'QUOTE' | 'DEFINITION';

export class Container {
  readonly position: TextPosition;
  readonly type: ContainerType;
  readonly parent: Container | null;
  readonly indentation: string;
  readonly contents: Chunk[];
  private readonly _blankPrefix: string;

  constructor (position: TextPosition, type: ContainerType, parent: Container | null, indentation: string) {
    this.position = position;
    this.type = type;
    this.parent = parent;
    this.indentation = indentation;
    this._blankPrefix = trimRight(indentation);
    this.contents = [];
  }

  get blankPrefix (): string {
    return this._blankPrefix;
  }

  add (chunk: Chunk): this {
    this.contents.push(chunk);
    return this;
  }

  isRoot (): boolean {
    return this.parent == null;
  }
}
