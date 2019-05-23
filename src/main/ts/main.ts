import {preprocess} from "./pp/Preprocessor";
import * as fs from "fs";
import {Section} from "./parse/Section";
import {Chunks} from "./pp/Chunk";

const fileName = process.argv[1];

const chunks = new Chunks(preprocess(fileName, fs.readFileSync(fileName, "utf8")).contents);

const document: Section = {
  contents: [],
};
