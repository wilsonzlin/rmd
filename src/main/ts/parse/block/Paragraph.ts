import {Leaf} from "../../pp/Leaf";
import {parseRichText, RichText} from "../text/RichText";
import {configurableSyntaxParser} from "../Configuration";
import {Chunks} from "../../pp/Chunk";

export type Paragraph = {
  text: RichText;
};

export const parseParagraph = configurableSyntaxParser((chunks: Chunks): Paragraph => {
  // TODO Validation
  const raw = chunks.accept() as Leaf;

  return {
    text: parseRichText(raw.contents.join(" ")),
  };
}, {});
