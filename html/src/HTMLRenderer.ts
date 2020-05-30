import hljs from 'highlight.js';
import {AllHtmlEntities} from 'html-entities';
import * as rmd from 'rmd-parse';

const encoder = new AllHtmlEntities();

export type SectionHandler = (renderer: HTMLRenderer, cfg: rmd.Configuration, contents: rmd.Block[]) => string;
export type LanguageHandler = (renderer: HTMLRenderer, code: string) => string;

const computeIfAbsent = <K, V> (map: Map<K, V>, key: K, producer: (key: K) => V): V => {
  if (!map.has(key)) {
    map.set(key, producer(key));
  }
  return map.get(key)!;
};

const getOrDefault = <K, V> (map: Map<K, V>, key: K, def: V): V => {
  if (map.has(key)) {
    return map.get(key)!;
  }
  return def;
};

const tagAttrsHtml = (attributes: rmd.Markup['attributes']): string => {
  return Array.from(
    attributes.entries(),
    ([name, value]) =>
      typeof value === 'boolean'
        ? value ? name : ''
        : `${name}="${encoder.encode(`${value}`)}"`,
  ).join(' ');
};

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

  renderBlocks (renderedBlocks: string[]): string {
    return renderedBlocks.join('');
  }

  renderCodeBlock (lang: string | null, rawData: string): string {
    if (lang != null) {
      const handler = this.languageHandlers.get(lang);
      if (handler) {
        return handler(this, rawData);
      }

      if (hljs.getLanguage(lang)) {
        return `<pre>${hljs.highlight(lang, rawData, true).value}</pre>`;
      }
    }

    return `<pre>${rawData}</pre>`;
  }

  renderDefinition (renderedTitle: string, renderedContents: string): string {
    return `<dt>${renderedTitle}</dt><dd>${renderedContents}</dd>`;
  }

  renderDictionary (renderedDefinitions: string[]): string {
    return `<dl>${renderedDefinitions.join('')}</dl>`;
  }

  renderHeading (level: number, renderedText: string): string {
    return `<h${level}>${renderedText}</h${level}>`;
  }

  renderListItem (renderedContents: string): string {
    return `<li>${renderedContents}</li>`;
  }

  renderList (mode: rmd.Mode, renderedItems: string[]): string {
    const tag = mode == rmd.Mode.ORDERED ? 'ol' : 'ul';
    return `<${tag}>${renderedItems.join('')}</${tag}>`;
  }

  renderParagraph (renderedText: string): string {
    return `<p>${renderedText}</p>`;
  }

  renderQuote (renderedContents: string): string {
    return `<blockquote>${renderedContents}</blockquote>`;
  }

  renderRichText (raw: string, markup: rmd.Markup[]): string {
    const starts = new Map<number, rmd.Markup[]>();
    const ends = new Map<number, rmd.Markup[]>();
    const voids = new Map<number, rmd.Markup[]>();
    const splits = new Set<number>();

    for (const m of markup) {
      const start = m.start;
      const afterEnd = m.end + 1;
      splits.add(start);
      splits.add(afterEnd);
      if (start == afterEnd) {
        // Void tag.
        computeIfAbsent(voids, start, () => []).push(m);
      } else {
        // Since tags cannot overlap, ends must be inserted in reverse order,
        // as tags started earlier close after tags started after it.
        computeIfAbsent(starts, start, () => []).push(m);
        computeIfAbsent(ends, afterEnd, () => []).unshift(m);
      }
    }

    const splitsSorted = [...splits].sort((a, b) => a - b);

    let lastPos = 0;
    const split = [];
    for (const pos of splitsSorted) {
      split.push(encoder.encode(raw.slice(lastPos, pos)));
      const tags = [];
      // Process void tags first.
      for (const m of getOrDefault(voids, pos, [])) {
        const tagName = m.type;
        tags.push(`<${tagName} ${tagAttrsHtml(m.attributes)}></${tagName}>`);
      }
      // Process end tags before start tags.
      for (const m of getOrDefault(ends, pos, [])) {
        const tagName = m.type;
        tags.push(`</${tagName}>`);
      }
      for (const m of getOrDefault(starts, pos, [])) {
        const tagName = m.type;
        tags.push(`<${tagName} ${tagAttrsHtml(m.attributes)}>`);
      }
      split.push(tags.join(''));
      lastPos = pos;
    }
    split.push(encoder.encode(raw.slice(lastPos)));

    return split.join('');
  }

  renderSection (type: string, cfg: rmd.Configuration, rawContents: rmd.Block[]): string {
    const handler = this.sectionHandlers.get(type);
    if (!handler) {
      throw new TypeError(`No handler for section type "${type}" provided`);
    }
    return handler(this, cfg, rawContents);
  }

  renderRow (renderedCells: string[], _heading: boolean): string {
    return `<tr>${renderedCells.join('')}</tr>`;
  }

  renderCell (renderedText: string, heading: boolean): string {
    const tag = heading ? 'th' : 'td';
    return `<${tag}>${renderedText}</${tag}>`;
  }

  renderTable (renderedHead: string[], renderedBody: string[]): string {
    return `<table><thead>${renderedHead.join('')}<tbody>${renderedBody.join('')}</table>`;
  }
}
