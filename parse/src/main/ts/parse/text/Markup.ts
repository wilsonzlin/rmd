export type MarkupAttributes = Map<string, boolean | number | string>;

export class Markup {
  constructor (
    // An HTML tag name.
    readonly type: string,
    readonly start: number,
    // Inclusive.
    readonly end: number,
    readonly attributes: MarkupAttributes,
  ) {
  }
}
