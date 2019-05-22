export class InternalError extends Error {
  constructor (message: string) {
    super(`An internal error occurred:\n\n${message}\n\nPlease report this to github.com/wilsonzlin/markscript/issues`);
  }
}
