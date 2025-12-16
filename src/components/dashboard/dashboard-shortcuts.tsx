"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useGlobalShortcuts, useNavigationShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { KeyboardShortcutsModal } from "@/components/ui/keyboard-shortcuts-modal";

export function DashboardShortcuts() {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const router = useRouter();

  useNavigationShortcuts(router);

  useGlobalShortcuts({
    onSearch: () => {
      // Future: Focus search input
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    },
    onHelp: () => setIsShortcutsOpen(true),
    onEscape: () => setIsShortcutsOpen(false),
  });

  return <KeyboardShortcutsModal open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen} />;
}
