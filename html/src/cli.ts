#!/usr/bin/env node

import minimist from "minimist";
import * as fs from "fs";
import * as rmd from "rmd-parse";
import {HTMLRenderer} from "./HTMLRenderer";

enum CLI_ERROR {
  IO_READ = 1,
  IO_WRITE,
  DOC_PARSE,
  DOC_RENDER,
}

process.exit((args => {
  const error = (preface: string, status: CLI_ERROR, err?: any, stack: boolean = false): CLI_ERROR => {
    console.error(preface);
    // This also checks undefined.
    if (err != null) {
      if (err instanceof Error) {
        console.error(err.message);
        if (stack && err.stack) {
          console.error();
          console.error(`Stack trace:`);
          console.error(err.stack.slice(err.name.length + ": ".length + err.message.length + "\n".length));
        }
      } else {
        console.error(err);
      }
    }
    return status;
  };

  const inFile = args.in;
  const outFile = args.out;

  let input: string;
  try {
    input = fs.readFileSync(inFile, "utf8");
  } catch (err) {
    return error(`Failed to read file with error:`, CLI_ERROR.IO_READ, err);
  }

  let document: rmd.Document;
  try {
    document = rmd.parse(inFile, input);
  } catch (err) {
    return error(`Failed to parse document with error:`, CLI_ERROR.DOC_PARSE, err, true);
  }

  let output: string;
  try {
    output = new HTMLRenderer().processDocument(document);
  } catch (err) {
    return error(`Failed to render document with error:`, CLI_ERROR.DOC_RENDER, err, true);
  }

  try {
    fs.writeFileSync(outFile, output);
  } catch (err) {
    return error(`Failed to write file with error:`, CLI_ERROR.IO_WRITE, err);
  }

  return 0;
})(minimist(process.argv.slice(2))));
