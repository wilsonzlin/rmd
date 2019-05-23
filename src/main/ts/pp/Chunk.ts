import {Container, ContainerType} from "./Container";
import {Leaf, LeafType} from "./Leaf";
import {Scanner} from "../util/Scanner";
import {TextFilePosition} from "../util/IPosition";

export type Chunk = Container | Leaf;

export class Chunks extends Scanner<Chunk, undefined, TextFilePosition> {
  constructor (source: (Container | Leaf)[]) {
    super(undefined, source);
  }

  nextPosition (): TextFilePosition {
    return this.peek().position;
  }
}
