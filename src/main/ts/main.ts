import {preprocess} from "./pp/Preprocessor";
import {Chunks} from "./pp/Chunk";
import {Document, parseDocument} from "./parse/Document";
import {Heading} from "./parse/block/Heading";
import {Quote} from "./parse/block/Quote";
import {Definition, Dictionary} from "./parse/block/Dictionary";
import {Cell, Row, Table} from "./parse/block/Table";
import {CodeBlock} from "./parse/block/CodeBlock";
import {Section} from "./parse/block/Section";
import {Paragraph} from "./parse/block/Paragraph";
import {List, ListItem, Mode} from "./parse/block/List";
import {Markup, RichText} from "./parse/text/RichText";
import {Block} from "./parse/block/Block";
import {assertionFailure} from "./err/InternalError";
import {Configuration} from "./parse/Configuration";

export {Block} from "./parse/block/Block";
export {CodeBlock} from "./parse/block/CodeBlock";
export {Definition, Dictionary} from "./parse/block/Dictionary";
export {Document} from "./parse/Document";
export {Heading} from "./parse/block/Heading";
export {List, ListItem, Mode} from "./parse/block/List";
export {Paragraph} from "./parse/block/Paragraph";
export {Quote} from "./parse/block/Quote";
export {RichText, Markup, LinkMarkup, MarkupType} from "./parse/text/RichText";
export {Section} from "./parse/block/Section";
export {Table, Row, Cell} from "./parse/block/Table";
export {Configuration} from "./parse/Configuration";
export {TextPosition} from "./util/Position";

export const parse = (name: string, text: string): Document => {
  const preprocessed = preprocess(name, text);
  const chunks = new Chunks(preprocessed.contents);
  return parseDocument(chunks);
};

/**
 * A convenient interface that requires methods for handling all block and text syntaxes.
 * `visitBlock` is omitted but a simple default implementation is provided at {@link visitBlock}.
 * `visitBlocks` is omitted as the return type might be different and it's easier to leave it to the implementer.
 */
export interface SyntaxWalker<R> {
  visitCell (st: Cell): R;

  visitCodeBlock (st: CodeBlock): R;

  visitDefinition (st: Definition): R;

  visitDictionary (st: Dictionary): R;

  visitHeading (st: Heading): R;

  visitList (st: List): R;

  visitListItem (st: ListItem): R;

  visitParagraph (st: Paragraph): R;

  visitQuote (st: Quote): R;

  visitRichText (st: RichText): R;

  visitRow (st: Row): R;

  visitSection (st: Section): R;

  visitTable (st: Table): R;
}

export const visitBlock = <R> (walker: SyntaxWalker<R>, st: Block): R => {
  if (st instanceof List) {
    return walker.visitList(st);
  } else if (st instanceof Paragraph) {
    return walker.visitParagraph(st);
  } else if (st instanceof CodeBlock) {
    return walker.visitCodeBlock(st);
  } else if (st instanceof Quote) {
    return walker.visitQuote(st);
  } else if (st instanceof Dictionary) {
    return walker.visitDictionary(st);
  } else if (st instanceof Table) {
    return walker.visitTable(st);
  } else if (st instanceof Section) {
    return walker.visitSection(st);
  } else if (st instanceof Heading) {
    return walker.visitHeading(st);
  } else {
    return assertionFailure();
  }
};

export abstract class Renderer implements SyntaxWalker<string> {
  processDocument (doc: Document): string {
    return this.visitBlocks(doc.contents);
  }

  visitBlock (st: Block): string {
    return visitBlock(this, st);
  }

  visitBlocks (st: Block[]): string {
    return this.renderBlocks(
      st.map(s => this.visitBlock(s))
    );
  }

  visitCell (st: Cell): string {
    return this.renderCell(
      this.visitRichText(st.text),
      st.heading
    );
  }

  visitCodeBlock (st: CodeBlock): string {
    return this.renderCodeBlock(
      st.lang,
      st.data
    );
  }

  visitDefinition (st: Definition): string {
    return this.renderDefinition(
      this.visitRichText(st.title),
      this.visitBlocks(st.contents)
    );
  }

  visitDictionary (st: Dictionary): string {
    return this.renderDictionary(
      st.definitions.map(d => this.visitDefinition(d))
    );
  }

  visitHeading (st: Heading): string {
    return this.renderHeading(
      st.level,
      this.visitRichText(st.text)
    );
  }

  visitList (st: List): string {
    return this.renderList(
      st.mode,
      st.items.map(i => this.visitListItem(i))
    );
  }

  visitListItem (st: ListItem): string {
    return this.renderListItem(
      this.visitBlocks(st.contents)
    );
  }

  visitParagraph (st: Paragraph): string {
    return this.renderParagraph(
      this.visitRichText(st.text)
    );
  }

  visitQuote (st: Quote): string {
    return this.renderQuote(
      this.visitBlocks(st.contents)
    );
  }

  visitRichText (st: RichText): string {
    return this.renderRichText(st.raw, st.markup);
  }

  visitRow (st: Row): string {
    return this.renderRow(
      st.cells.map(c => this.visitCell(c)),
      st.heading
    );
  }

  visitSection (st: Section): string {
    return this.renderSection(
      st.type,
      st.config,
      st.contents
    );
  }

  visitTable (st: Table): string {
    return this.renderTable(
      st.head.map(r => this.visitRow(r)),
      st.body.map(r => this.visitRow(r))
    );
  }

  protected abstract renderBlocks (renderedBlocks: string[]): string;

  protected abstract renderCell (renderedText: string, heading: boolean): string;

  protected abstract renderCodeBlock (lang: string | null, rawData: string): string;

  protected abstract renderDefinition (renderedTitle: string, renderedContents: string): string;

  protected abstract renderDictionary (renderedDefinitions: string[]): string;

  protected abstract renderHeading (level: number, renderedText: string): string;

  protected abstract renderList (mode: Mode, renderedItems: string[]): string;

  protected abstract renderListItem (renderedContents: string): string;

  protected abstract renderParagraph (renderedText: string): string;

  protected abstract renderQuote (renderedContents: string): string;

  protected abstract renderRichText (raw: string, markup: Markup[]): string;

  protected abstract renderRow (renderedCells: string[], heading: boolean): string;

  protected abstract renderSection (type: string, cfg: Configuration, rawContents: Block[]): string;

  protected abstract renderTable (renderedHead: string[], renderedBody: string[]): string;
}
