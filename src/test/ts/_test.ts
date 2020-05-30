import * as fs from 'fs';
import * as path from 'path';

const TEST_RESOURCES_DIR = path.resolve(path.join(__dirname, '..', 'resources'));

export const readTestResource = (subpath: string): string => {
  return fs.readFileSync(`${TEST_RESOURCES_DIR}/${subpath}`, 'utf8');
};
