import {assert} from '../err/InternalError';

export class Stack<V> {
  private readonly stack: V[] = [];

  isEmpty (): boolean {
    return !this.stack.length;
  }

  peek (): V | null {
    if (this.isEmpty()) {
      return null;
    }
    return this.stack[this.stack.length - 1];
  }

  some (pred: (val: V) => boolean): boolean {
    return this.stack.some(pred);
  }

  push (val: V): this {
    this.stack.push(val);
    return this;
  }

  pop (): V {
    assert(!this.isEmpty());
    return this.stack.pop()!;
  }
}
