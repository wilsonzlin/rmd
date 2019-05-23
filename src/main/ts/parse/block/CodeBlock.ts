import {configurableSyntaxParser} from "../Configuration";
import {Leaf} from "../../pp/Leaf";

export type CodeBlock = {
  lang: string;
  data: string;
};

export const parseCodeBlock = configurableSyntaxParser(chunks => {
  // TODO Validation
  const rawCodeBlock = chunks.accept() as Leaf;

  // TODO Validation
  const lang = rawCodeBlock.contents[0].replace(/^`+/, "");

  return {
    lang: lang,
    // TODO Validation
    data: rawCodeBlock.contents.slice(1, -1).join("\n"),
  };
}, {});
