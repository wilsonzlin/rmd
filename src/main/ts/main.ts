import {preprocess} from "./pp/Preprocessor";
import {Chunks} from "./pp/Chunk";
import {Document, parseDocument} from "./parse/Document";

export const parse = (name: string, text: string): Document => {
  return parseDocument(new Chunks(preprocess(name, text).contents));
};
