#!/usr/bin/env node

import minimist from "minimist";
import * as fs from "fs";
import * as rmd from "rmd-parse";
import {HTMLRenderer} from "./HTMLRenderer";

process.exit((args => {
  const inFile = args.in;
  const outFile = args.out;

  const input = fs.readFileSync(inFile, "utf8");

  let document: rmd.Document;
  try {
    document = rmd.parse(inFile, input);
  } catch (err) {
    console.error(`Failed to parse document ${inFile} with error:`);
    if (err instanceof Error) {
      console.error(err.message);
      if (err.stack) {
        console.error();
        console.error(`Stack trace:`);
        console.error(err.stack.slice(err.name.length + ": ".length + err.message.length + "\n".length));
      }
    } else {
      console.error(err);
    }
    return 1;
  }

  const output = new HTMLRenderer().processDocument(document);

  fs.writeFileSync(outFile, output);

  return 0;
})(minimist(process.argv.slice(2))));
