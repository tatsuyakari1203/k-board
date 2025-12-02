import type { EditorThemeClasses } from "lexical";

export const editorTheme: EditorThemeClasses = {
  // Root
  root: "focus:outline-none",

  // Text formatting
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    code: "bg-secondary/50 px-1.5 py-0.5 rounded text-sm font-mono",
  },

  // Headings
  heading: {
    h1: "text-2xl font-bold mt-4 mb-2",
    h2: "text-xl font-bold mt-3 mb-2",
    h3: "text-lg font-semibold mt-2 mb-1",
  },

  // Paragraph
  paragraph: "mb-2 leading-relaxed",

  // Links
  link: "text-primary underline hover:no-underline cursor-pointer",

  // Lists
  list: {
    nested: {
      listitem: "list-none",
    },
    ol: "list-decimal ml-4 mb-2",
    ul: "list-disc ml-4 mb-2",
    listitem: "mb-1",
    listitemChecked: "line-through text-muted-foreground",
    listitemUnchecked: "",
  },

  // Quote
  quote: "border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-2",

  // Code block
  code: "bg-secondary rounded-md p-4 font-mono text-sm overflow-x-auto my-2",
  codeHighlight: {
    atrule: "text-purple-500",
    attr: "text-blue-500",
    boolean: "text-orange-500",
    builtin: "text-cyan-500",
    cdata: "text-gray-500",
    char: "text-green-500",
    class: "text-yellow-500",
    "class-name": "text-yellow-500",
    comment: "text-gray-500 italic",
    constant: "text-orange-500",
    deleted: "text-red-500",
    doctype: "text-gray-500",
    entity: "text-red-500",
    function: "text-blue-500",
    important: "text-red-500",
    inserted: "text-green-500",
    keyword: "text-purple-500",
    namespace: "text-gray-500",
    number: "text-orange-500",
    operator: "text-gray-700",
    prolog: "text-gray-500",
    property: "text-blue-500",
    punctuation: "text-gray-700",
    regex: "text-red-500",
    selector: "text-green-500",
    string: "text-green-500",
    symbol: "text-orange-500",
    tag: "text-red-500",
    url: "text-cyan-500",
    variable: "text-orange-500",
  },

  // Image
  image: "max-w-full h-auto rounded-md my-2",

  // Table
  table: "border-collapse w-full my-2",
  tableCell: "border border-border p-2 text-left",
  tableCellHeader: "border border-border p-2 bg-muted font-semibold",
  tableRow: "",
  tableRowStriping: "odd:bg-muted/50",
};
