import {AllHtmlEntities} from "html-entities";
import * as rmd from "rmd-parse";
import hljs from "highlight.js";

const encoder = new AllHtmlEntities();

export type SectionHandler = (renderer: HTMLRenderer, cfg: rmd.Configuration, contents: rmd.Block[]) => string;
export type LanguageHandler = (renderer: HTMLRenderer, code: string) => string;

export class HTMLRenderer extends rmd.Renderer {
  readonly sectionHandlers = new Map<string, SectionHandler>();
  readonly languageHandlers = new Map<string, LanguageHandler>();

  addSectionHandler (type: string, handler: SectionHandler): this {
    if (this.sectionHandlers.has(type)) {
      throw new TypeError(`Handler for section type "${type}" already exists`);
    }
    this.sectionHandlers.set(type, handler);
    return this;
  }

  addLanguageHandler (lang: string, handler: LanguageHandler): this {
    if (this.languageHandlers.has(lang)) {
      throw new TypeError(`Handler for language "${lang}" already exists`);
    }
    this.languageHandlers.set(lang, handler);
    return this;
  }

  renderCodeBlock (lang: string | null, data: string): string {
    if (lang != null) {
      const handler = this.languageHandlers.get(lang);
      if (handler) {
        return handler(this, data);
      }

      if (hljs.getLanguage(lang)) {
        return `<pre>${hljs.highlight(lang, data, true).value}</pre>`;
      }
    }

    return `<pre>${data}</pre>`;
  }

  renderDefinition (title: string, contents: string): string {
    return `<dt>${title}</dt><dd>${contents}</dd>`;
  }

  renderBlocks (blocks: string[]): string {
    return blocks.join("");
  }

  renderDictionary (definitions: string[]): string {
    return `<dl>${definitions.join("")}</dl>`;
  }

  renderHeading (level: number, text: string): string {
    return `<h${level}>${text}</h${level}>`;
  }

  renderListItem (contents: string): string {
    return `<li>${contents}</li>`;
  }

  renderList (mode: rmd.Mode, items: string[]): string {
    const tag = mode == rmd.Mode.ORDERED ? "ol" : "ul";
    return `<${tag}>${items.join("")}</${tag}>`;
  }

  renderParagraph (text: string): string {
    return `<p>${text}</p>`;
  }

  renderQuote (contents: string): string {
    return `<blockquote>${contents}</blockquote>`;
  }

  renderRichText (raw: string, markup: rmd.Markup[]): string {
    const starts = new Map<number, rmd.Markup[]>();
    const ends = new Map<number, rmd.Markup[]>();

    for (const m of markup) {
      if (m instanceof rmd.LinkMarkup) {
      }
      // TODO
    }

    return encoder.encode(raw);
  }

  renderSection (type: string, cfg: rmd.Configuration, contents: rmd.Block[]): string {
    const handler = this.sectionHandlers.get(type);
    if (!handler) {
      throw new TypeError(`No handler for section type "${type}" provided`);
    }
    return handler(this, cfg, contents);
  }

  renderRow (cells: string[], heading: boolean): string {
    return `<tr>${cells.join("")}</tr>`;
  }

  renderCell (text: string, heading: boolean): string {
    const tag = heading ? "th" : "td";
    return `<${tag}>${text}</${tag}>`;
  }

  renderTable (headings: string[], body: string[]): string {
    return `<table><thead>${headings.join("")}<tbody>${body.join("")}</table>`;
  }
}
