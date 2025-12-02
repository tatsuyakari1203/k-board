"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { TRANSFORMERS } from "@lexical/markdown";

import { editorTheme } from "./theme";
import { ToolbarPlugin, OnChangePlugin, InitialContentPlugin } from "./plugins";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

interface LexicalEditorProps {
  value?: string; // JSON string from editorState.toJSON()
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
  showToolbar?: boolean;
  readOnly?: boolean;
  minHeight?: number;
}

// ============================================
// NODES
// ============================================

const NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
];

// ============================================
// ERROR HANDLER
// ============================================

function onError(error: Error) {
  console.error("Lexical Editor Error:", error);
}

// ============================================
// MAIN COMPONENT
// ============================================

export function LexicalEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  className,
  editorClassName,
  showToolbar = true,
  readOnly = false,
  minHeight = 120,
}: LexicalEditorProps) {
  const initialConfig = {
    namespace: "KERPEditor",
    theme: editorTheme,
    nodes: NODES,
    onError,
    editable: !readOnly,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className={cn(
          "border border-input rounded-md bg-background overflow-hidden",
          "focus-within:ring-1 focus-within:ring-ring focus-within:border-ring",
          className
        )}
      >
        {showToolbar && !readOnly && <ToolbarPlugin />}

        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={cn(
                  "p-3 outline-none text-sm leading-relaxed",
                  editorClassName
                )}
                style={{ minHeight }}
                aria-placeholder={placeholder}
                placeholder={
                  <div
                    className="absolute top-3 left-3 text-muted-foreground text-sm pointer-events-none"
                  >
                    {placeholder}
                  </div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>

        {/* Plugins */}
        <HistoryPlugin />
        <ListPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />

        {value && <InitialContentPlugin initialContent={value} />}
        {onChange && <OnChangePlugin onChange={onChange} />}
      </div>
    </LexicalComposer>
  );
}

// ============================================
// READ ONLY VIEWER
// ============================================

interface LexicalViewerProps {
  value: string;
  className?: string;
}

export function LexicalViewer({ value, className }: LexicalViewerProps) {
  return (
    <LexicalEditor
      value={value}
      readOnly
      showToolbar={false}
      className={cn("border-none", className)}
      minHeight={0}
    />
  );
}
