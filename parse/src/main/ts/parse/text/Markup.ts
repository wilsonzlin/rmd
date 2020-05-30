export type MarkupAttributes = Map<string, boolean | number | string>;

export class Markup {
  constructor (
    readonly type: string,
    readonly start: number,
    readonly end: number,
    readonly attributes: MarkupAttributes,
  ) {
  }
}
