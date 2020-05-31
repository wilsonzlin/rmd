import {assertionFailure} from './err/InternalError';
import {Block} from './parse/block/Block';
import {CodeBlock} from './parse/block/CodeBlock';
import {Definition, Dictionary} from './parse/block/Dictionary';
import {Heading} from './parse/block/Heading';
import {List, ListItem, Mode} from './parse/block/List';
import {Paragraph} from './parse/block/Paragraph';
import {Quote} from './parse/block/Quote';
import {Section} from './parse/block/Section';
import {Cell, Row, Table} from './parse/block/Table';
import {Configuration} from './parse/Configuration';
import {Document, parseDocument} from './parse/Document';
import {Markup} from './parse/text/Markup';
import {RichText} from './parse/text/RichText';
import {Chunks} from './pp/Chunk';
import {preprocess} from './pp/Preprocessor';

export {Block} from './parse/block/Block';
export {CodeBlock} from './parse/block/CodeBlock';
export {Definition, Dictionary} from './parse/block/Dictionary';
export {Document} from './parse/Document';
export {Heading} from './parse/block/Heading';
export {List, ListItem, Mode} from './parse/block/List';
export {Paragraph} from './parse/block/Paragraph';
export {Quote} from './parse/block/Quote';
export {Markup} from './parse/text/Markup';
export {RichText} from './parse/text/RichText';
export {Section} from './parse/block/Section';
export {Table, Row, Cell} from './parse/block/Table';
export {Configuration} from './parse/Configuration';
export {TextPosition} from './util/Position';

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

type RendererWalkResult = Generator<string | Promise<string>, string, string>;

// NOTE: Any changes to this class should be reflected in AsyncRenderer.
export abstract class Renderer implements SyntaxWalker<RendererWalkResult> {
  processDocumentSync (doc: Document): string {
    const it = this.visitBlocks(doc.contents);
    let nextValue = '';
    while (true) {
      const next = it.next(nextValue);
      if (next.done) {
        return next.value;
      }
      if (next.value instanceof Promise) {
        throw new TypeError(`This renderer is asynchronous, but processDocumentSync was called`);
      }
      nextValue = next.value;
    }
  }

  async processDocumentAsync (doc: Document): Promise<string> {
    const it = this.visitBlocks(doc.contents);
    let nextValue = '';
    while (true) {
      const next = it.next(nextValue);
      if (next.done) {
        return next.value;
      }
      if (next.value instanceof Promise) {
        try {
          nextValue = await next.value;
        } catch (e) {
          throw e;
        }
      } else {
        nextValue = next.value;
      }
    }
  }

  * visitBlock (st: Block): RendererWalkResult {
    return yield* visitBlock(this, st);
  }

  * visitBlocks (st: Block[]): RendererWalkResult {
    const renderedBlocks = [];
    for (const s of st) {
      renderedBlocks.push(yield* this.visitBlock(s));
    }
    return yield this.renderBlocks(renderedBlocks);
  }

  * visitCell (st: Cell) {
    return yield this.renderCell(
      yield* this.visitRichText(st.text),
      st.heading,
    );
  }

  * visitCodeBlock (st: CodeBlock) {
    return yield this.renderCodeBlock(
      st.lang,
      st.data,
    );
  }

  * visitDefinition (st: Definition) {
    return yield this.renderDefinition(
      yield* this.visitRichText(st.title),
      yield* this.visitBlocks(st.contents),
    );
  }

  * visitDictionary (st: Dictionary) {
    const renderedDefinitions = [];
    for (const d of st.definitions) {
      renderedDefinitions.push(yield* this.visitDefinition(d));
    }
    return yield this.renderDictionary(renderedDefinitions);
  }

  * visitHeading (st: Heading) {
    return yield this.renderHeading(
      st.level,
      yield* this.visitRichText(st.text),
    );
  }

  * visitList (st: List) {
    const renderedItems = [];
    for (const i of st.items) {
      renderedItems.push(yield* this.visitListItem(i));
    }
    return yield this.renderList(
      st.mode,
      renderedItems,
    );
  }

  * visitListItem (st: ListItem) {
    return yield this.renderListItem(
      yield* this.visitBlocks(st.contents),
    );
  }

  * visitParagraph (st: Paragraph) {
    return yield this.renderParagraph(
      yield* this.visitRichText(st.text),
    );
  }

  * visitQuote (st: Quote) {
    return yield this.renderQuote(
      yield* this.visitBlocks(st.contents),
    );
  }

  * visitRichText (st: RichText) {
    return yield this.renderRichText(st.raw, st.markup);
  }

  * visitRow (st: Row) {
    const renderedCells = [];
    for (const c of st.cells) {
      renderedCells.push(yield* this.visitCell(c));
    }
    return yield this.renderRow(
      renderedCells,
      st.heading,
    );
  }

  * visitSection (st: Section) {
    return yield this.renderSection(
      st.type,
      st.config,
      st.contents,
    );
  }

  * visitTable (st: Table) {
    const renderedHead = [];
    for (const r of st.head) {
      renderedHead.push(yield* this.visitRow(r));
    }
    const renderedBody = [];
    for (const r of st.body) {
      renderedBody.push(yield* this.visitRow(r));
    }
    return yield this.renderTable(renderedHead, renderedBody);
  }

  protected abstract renderBlocks (renderedBlocks: string[]): string | Promise<string>;

  protected abstract renderCell (renderedText: string, heading: boolean): string | Promise<string>;

  protected abstract renderCodeBlock (lang: string | null, rawData: string): string | Promise<string>;

  protected abstract renderDefinition (renderedTitle: string, renderedContents: string): string | Promise<string>;

  protected abstract renderDictionary (renderedDefinitions: string[]): string | Promise<string>;

  protected abstract renderHeading (level: number, renderedText: string): string | Promise<string>;

  protected abstract renderList (mode: Mode, renderedItems: string[]): string | Promise<string>;

  protected abstract renderListItem (renderedContents: string): string | Promise<string>;

  protected abstract renderParagraph (renderedText: string): string | Promise<string>;

  protected abstract renderQuote (renderedContents: string): string | Promise<string>;

  protected abstract renderRichText (raw: string, markup: Markup[]): string | Promise<string>;

  protected abstract renderRow (renderedCells: string[], heading: boolean): string | Promise<string>;

  protected abstract renderSection (type: string, cfg: Configuration, rawContents: Block[]): string | Promise<string>;

  protected abstract renderTable (renderedHead: string[], renderedBody: string[]): string | Promise<string>;
}
