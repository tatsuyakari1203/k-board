"use client";

import { useEffect, useCallback } from "react";

// ============================================
// TYPES
// ============================================

export interface Shortcut {
  key: string;
  then?: string; // For sequence shortcuts like 'g' then 'h'
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  global?: boolean; // If true, works even when input is focused
}

export interface ShortcutGroup {
  name: string;
  shortcuts: Omit<Shortcut, "action">[];
}

// ============================================
// PREDEFINED SHORTCUTS
// ============================================

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    name: "Điều hướng",
    shortcuts: [
      { key: "g", then: "h", description: "Đi tới Dashboard" },
      { key: "g", then: "b", description: "Đi tới Boards" },
      { key: "g", then: "t", description: "Đi tới Todo" },
      { key: "g", then: "a", description: "Đi tới Admin" },
    ] as Omit<Shortcut, "action">[],
  },
  {
    name: "Thao tác chung",
    shortcuts: [
      { key: "n", description: "Tạo mới task" },
      { key: "/", description: "Tìm kiếm" },
      { key: "?", description: "Hiển thị phím tắt" },
      { key: "Escape", description: "Đóng modal/dialog" },
    ],
  },
  {
    name: "Board Actions",
    shortcuts: [
      { key: "c", description: "Tạo task mới" },
      { key: "f", description: "Mở filter" },
      { key: "s", description: "Mở sort" },
      { key: "1", description: "Chuyển Table view" },
      { key: "2", description: "Chuyển Kanban view" },
    ],
  },
];

// ============================================
// HOOK
// ============================================

export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled: boolean = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Skip if typing in input/textarea (unless shortcut is global)
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      for (const shortcut of shortcuts) {
        if (isInput && !shortcut.global) continue;

        if (!event.key || !shortcut.key) continue;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatch = shortcut.meta ? event.metaKey : true;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}

// ============================================
// NAVIGATION SHORTCUTS HOOK
// ============================================

export function useNavigationShortcuts(router: { push: (path: string) => void }) {
  const shortcuts: Shortcut[] = [
    {
      key: "h",
      description: "Đi tới Dashboard",
      action: () => router.push("/dashboard"),
    },
    {
      key: "b",
      description: "Đi tới Boards",
      action: () => router.push("/dashboard/boards"),
    },
    {
      key: "t",
      description: "Đi tới Todo",
      action: () => router.push("/dashboard/todo"),
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

// ============================================
// GLOBAL SHORTCUTS HOOK
// ============================================

export function useGlobalShortcuts(options: {
  onSearch?: () => void;
  onHelp?: () => void;
  onEscape?: () => void;
}) {
  const shortcuts: Shortcut[] = [];

  if (options.onSearch) {
    shortcuts.push({
      key: "/",
      description: "Tìm kiếm",
      action: options.onSearch,
      global: false,
    });
    shortcuts.push({
      key: "k",
      ctrl: true,
      description: "Tìm kiếm (Cmd+K)",
      action: options.onSearch,
      global: true,
    });
  }

  if (options.onHelp) {
    shortcuts.push({
      key: "?",
      shift: true,
      description: "Hiển thị phím tắt",
      action: options.onHelp,
      global: false,
    });
  }

  if (options.onEscape) {
    shortcuts.push({
      key: "Escape",
      description: "Đóng modal",
      action: options.onEscape,
      global: true,
    });
  }

  useKeyboardShortcuts(shortcuts);
}

// ============================================
// FORMAT SHORTCUT KEY
// ============================================

export function formatShortcutKey(shortcut: Partial<Shortcut>): string {
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(navigator?.platform?.includes("Mac") ? "⌘" : "Ctrl");
  }
  if (shortcut.shift) parts.push("⇧");
  if (shortcut.alt) parts.push(navigator?.platform?.includes("Mac") ? "⌥" : "Alt");

  parts.push(shortcut.key?.toUpperCase() || "");

  return parts.join(" + ");
}
