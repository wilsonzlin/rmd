import {preprocess} from "../../../main/ts/pp/Preprocessor";
import {readTestResource} from "../_test";

describe("preprocess", () => {
  const chunks = preprocess("overall", readTestResource("code/overall.rmd"));

  // TODO
});
