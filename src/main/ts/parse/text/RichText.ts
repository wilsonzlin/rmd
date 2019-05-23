export enum MarkupType {
  STRONG,
  EMPHASIS,
  STRIKETHROUGH,
  UNDERLINE,

  CODE,

  LINK_HEADING,
  LINK_ANCHOR,
  LINK_FOOTNOTE,
  LINK_ARTICLE,
  LINK_EMAIL,
  LINK_EXTERNAL,
}

export interface Markup {
  type: MarkupType,
  start: number;
  end: number;
}

export interface LinkMarkup extends Markup {
  type: MarkupType.LINK_HEADING | MarkupType.LINK_ANCHOR | MarkupType.LINK_FOOTNOTE | MarkupType.LINK_ARTICLE | MarkupType.LINK_EMAIL | MarkupType.LINK_EXTERNAL;
  target: string;
  tip: string | null;
  label: string | null;
}

export type RichText = {
  raw: string;
  formatting: Markup[];
}

export const parseRichText = (raw: string): RichText => {
  // todo
  return {
    raw: raw,
    formatting: [],
  };
};
