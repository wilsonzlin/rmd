import hljs from 'highlight.js';
import {AllHtmlEntities} from 'html-entities';
import {Block, Configuration, Markup, Mode, Renderer} from 'rmd-parse';

const encoder = new AllHtmlEntities();
const toEntities = (raw: string) => encoder.encode(raw);

export type SectionHandler = (props: { id?: string, renderer: HTMLRenderer, cfg: Configuration, contents: Block[] }) => string | Promise<string>;
export type LanguageHandler = (props: { id?: string, renderer: HTMLRenderer, code: string }) => string | Promise<string>;

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

const tagAttrsHtml = (attributes: Markup['attributes']): string => {
  return Array.from(
    attributes.entries(),
    ([name, value]) =>
      typeof value === 'boolean'
        ? value ? name : ''
        : `${name}="${toEntities(`${value}`)}"`,
  ).join(' ');
};

export class HTMLRenderer extends Renderer {
  private readonly sectionHandlers = new Map<string, SectionHandler>();
  private readonly languageHandlers = new Map<string, LanguageHandler>();

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

  renderBlocks ({renderedBlocks}: { renderedBlocks: string[] }): string {
    return renderedBlocks.join('');
  }

  renderCodeBlock ({id = '', lang, rawData}: { id?: string; lang: string | null, rawData: string }): string | Promise<string> {
    if (lang != null) {
      const handler = this.languageHandlers.get(lang);
      if (handler) {
        return handler({
          id,
          renderer: this,
          code: rawData,
        });
      }

      if (hljs.getLanguage(lang)) {
        return `<pre id="${toEntities(id)}">${hljs.highlight(lang, rawData, true).value}</pre>`;
      }
    }

    return `<pre id="${toEntities(id)}">${rawData}</pre>`;
  }

  renderDefinition ({renderedTitle, renderedContents}: { renderedTitle: string, renderedContents: string }): string {
    return `<dt>${renderedTitle}</dt><dd>${renderedContents}</dd>`;
  }

  renderDictionary ({id = '', renderedDefinitions}: { id?: string; renderedDefinitions: string[] }): string {
    return `<dl id="${toEntities(id)}">${renderedDefinitions.join('')}</dl>`;
  }

  renderHeading ({id = '', level, renderedText}: { id?: string; level: number, renderedText: string }): string {
    return `<h${level} id="${toEntities(id)}">${renderedText}</h${level}>`;
  }

  renderListItem ({id = '', renderedContents}: { id?: string; renderedContents: string }): string {
    return `<li id="${toEntities(id)}">${renderedContents}</li>`;
  }

  renderList ({id = '', mode, renderedItems}: { id?: string; mode: Mode, renderedItems: string[] }): string {
    const tag = mode == rmd.Mode.ORDERED ? 'ol' : 'ul';
    return `<${tag} id="${toEntities(id)}">${renderedItems.join('')}</${tag}>`;
  }

  renderParagraph ({id = '', renderedText}: { id?: string; renderedText: string }): string {
    return `<p id="${toEntities(id)}">${renderedText}</p>`;
  }

  renderQuote ({id = '', renderedContents}: { id?: string; renderedContents: string }): string {
    return `<blockquote $d="${toEntities(id)}">${renderedContents}</blockquote>`;
  }

  renderRichText ({raw, markup}: { raw: string, markup: Markup[] }): string {
    const starts = new Map<number, Markup[]>();
    const ends = new Map<number, Markup[]>();
    const voids = new Map<number, Markup[]>();
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

  renderSection ({id = '', type, cfg, rawContents}: { id?: string; type: string, cfg: Configuration, rawContents: Block[] }): string | Promise<string> {
    const handler = this.sectionHandlers.get(type);
    if (!handler) {
      throw new TypeError(`No handler for section type "${type}" provided`);
    }
    return handler({
      id,
      renderer: this,
      cfg,
      contents: rawContents,
    });
  }

  renderRow ({renderedCells}: { renderedCells: string[], heading: boolean }): string {
    return `<tr>${renderedCells.join('')}</tr>`;
  }

  renderCell ({heading, renderedText}: { renderedText: string, heading: boolean }): string {
    const tag = heading ? 'th' : 'td';
    return `<${tag}>${renderedText}</${tag}>`;
  }

  renderTable ({id = '', renderedHead, renderedBody}: { id?: string; renderedHead: string[], renderedBody: string[] }): string {
    return `<table id="${toEntities(id)}"><thead>${renderedHead.join('')}<tbody>${renderedBody.join('')}</table>`;
  }
}
