# Parsing strategy

Normalise line terminators (e.g. `s/\r\n?/\n/`), split into lines, ensuring not to split at escaped line terminators.

This makes it easy to detect:

- list items and their indentation levels (e.g. test each line begins with `/^\s*(-|[0-9]+\.) /`)
- continuation lines (e.g. content/text split across multiple lines of a list item, table cell, or paragraph)
- block terminations via blank lines

## Blocks

### Headings

Starts with one to six (inclusive) `#`.

Ends with blank line. All non-blank lines following are considered part of the heading text, including ones that might otherwise be starters for other blocks.

### Lists

Starts with zero or more spaces and/or tabs, followed by a hyphen or sequence of digits ended with a period, followed by a space, i.e. `/^\s*(-|[0-9]+\.) /`.

Each consecutive line that matches `/^\s*(-|[0-9]+\.) /` is considered the start of a new list item. It can be unordered or ordered regardless of the other item types.

Ends with blank line. All non-blank lines following that are not considered the start of a new list item are considered continuations of the content of the last item.

This means that to use `/^\s*(-|[0-9]+\.) /` literally as part of a previous item's content, any character in it or the previous line terminator must be escaped, e.g.:

```ms
- abc
\- not a new item

- abc \
- not a new item

- abc
-\ not a new item
```

It also means that a gap of more than one blank line between line items separates them into two list blocks, i.e. there cannot be even one blank line between list items for a single list.

#### Indentation

The indentation of an item is determined by the amount of spaces and/or tabs in an item. It does not matter what the indentation of any neighbouring item is.

Using both spaces and tabs as indentation, either as part of a single item or across multiple items as a whole in the same list block, is not allowed.

#### Configuration

Individual list items can have their own configuration. It must be provided immediately after the starter, e.g. `- {id="i1"} Item with anchor`.

#### Content

Not everything can go into a list item.

##### Code blocks

- Leading whitespace as part of line item indentation is trimmed from each line of the code block. The amount of whitespace is equivalent to the amount of whitespace before the code block starter.

##### Quotes

### Code blocks

Starts with two or more <code>`</code>.

Ends on line with exactly the same amount of <code>`</code> as starter line. The line must not contain any other characters, although for convenience it can contain trailing whitespace, e.g.:

````ms
``
Does not end on the next line, as it has one too many backticks
```
Does not end on the next line, as it has one non-whitespace trailing characters
`` !
``
````

### Quotes

- Possible nested block content e.g. quotes, tables, code blocks.

### Tables

### Definition lists

#### Footnotes

Footnotes are implemented using definition lists. This allows footnotes to:

- have rich content containing multiple blocks (e.g. tables and code blocks) with natural separators between footnotes
- automatically formatted and semantic content
- easy identification built in via definition configurations

### Configuration

Configuration can be specified on the line immediately before the start of any block, e.g.:

```ms
{id="a"}
# A title
```

#### Anchors

Any block can have an anchor ID, allowing the use of anchor links which jump to it when activated. The parameter is called `id` and takes a string matching `/^[a-z][a-z0-9-]*$/`, i.e. a lowercase alphanumerical string with optional hyphens that must start with an alphabet character.

### Ignored

- Blank lines
- Comments

## Formatting

### Bold

### Underline

### Italics

### Strikethrough

### Link

#### Heading

```ms
[link head="Section A"]section A[$]
[link head="Section A" $]
```

The title will be the text content of the heading, excluding any stricken text.
If self-closing, the label will be the content of the title, including any formatting.

#### Anchor

```ms
[link id="a"]read more in the relevant section[$]
```

The title will be the name of the referred block if available.
If self-closing, the label will be the name of the referred block. It's an error if it does not have one.

#### Footnote

```ms
[link foot="footid"]details[$]
[link foot="footid" $]
```

The title will be the footnote's text, excluding any stricken text, truncated with ellipsis if too long.
If self-closing, the label will be the ordinal of the footnote in superscript and wrapped with square brackets.

#### Article

```ms
[link art="Another article"]click here to find out more[$]
[link art="Another article" $]
```

The title will be the article's description.
If self-closing, the label will be the name of the article.

#### Email

```ms
[link mail="hello@goodbye.com" title="No spam please" $]
[link mail="hello@goodbye.com" title="No spam please"]send me an email[$]
```

#### External

```ms
[link ext="https://google.com" title="Google" $]
[link ext="https://google.com" title="Google"]search engine[$]
```

By default, all external links open in a new window or tab.
