const pkg = require("package");

const thisPackage = pkg(module);

class InternalError extends Error {
  constructor (message: string) {
    super(`An internal error occurred:\n\n${message}\n\nPlease report this to ${thisPackage.bugs.url}`);
  }
}

export const assert = (assertion: boolean): void => {
  if (!assertion) {
    throw new InternalError(`Assertion failed (refer to stack trace)`);
  }
};

export const assertionFailure = (): never => {
  throw new InternalError(`Assertion failed (refer to stack trace)`);
};

export const assertReason = (assertion: boolean, description: string): void => {
  if (!assertion) {
    throw new InternalError(`Assertion failed: ${description}`);
  }
};
