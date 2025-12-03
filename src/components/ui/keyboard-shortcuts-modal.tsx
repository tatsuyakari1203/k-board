"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SHORTCUT_GROUPS, formatShortcutKey, type Shortcut } from "@/hooks/use-keyboard-shortcuts";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Phím tắt</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.name} className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">{group.name}</h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {/* Handle 'then' sequence if present, otherwise standard format */}
                      {shortcut.then ? (
                        <>
                          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            {shortcut.key.toUpperCase()}
                          </kbd>
                          <span className="text-xs text-muted-foreground">then</span>
                          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            {shortcut.then.toUpperCase()}
                          </kbd>
                        </>
                      ) : (
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                          {formatShortcutKey(shortcut as Partial<Shortcut>)}
                        </kbd>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
