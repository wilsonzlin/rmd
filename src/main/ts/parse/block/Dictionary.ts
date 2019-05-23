import {Block, parseBlocks} from "./Block";
import {configurableSyntaxParser} from "../Configuration";
import {Chunks} from "../../pp/Chunk";
import {Container} from "../../pp/Container";
import {parseRichText, RichText} from "../text/RichText";
import {Leaf} from "../../pp/Leaf";

export type Definition = {
  title: RichText;
  contents: Block[];
}

export type Dictionary = {
  definitions: Definition[];
}

export const parseDictionary = configurableSyntaxParser(chunks => {
  const dict: Dictionary = {definitions: []};

  do {
    // TODO Validation (including length)
    const rawTitle = chunks.accept() as Leaf;
    // TODO Validation
    const rawValue = chunks.accept() as Container;

    // TODO Validation
    dict.definitions.push({
      title: parseRichText(rawTitle.contents[0]),
      contents: parseBlocks(new Chunks(rawValue.contents)),
    });
    // TODO Validation
  } while (chunks.peek().type == "DEFINITION");

  return dict;
}, {});
