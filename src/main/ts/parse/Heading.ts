import {configurableSyntaxParser} from "./Configuration";
import {Leaf} from "../pp/Leaf";
import {parseRichText, RichText} from "./text/RichText";

export type Heading = {
  text: RichText;
};

export const parseHeading = configurableSyntaxParser(chunks => {
  // TODO Validation including length
  const raw = chunks.accept() as Leaf;

  return {
    // TODO Validation
    text: parseRichText(raw.contents[0].replace(/^#+/, "")),
  };
}, {});
