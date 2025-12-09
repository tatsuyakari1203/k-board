"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export interface UserOption {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export function UserCell({
  value,
  users,
  onChange,
  compact = false,
  className,
  multiSelect = true,
}: {
  value: string | string[];
  users: UserOption[];
  onChange: (v: string | string[]) => void;
  compact?: boolean;
  className?: string;
  multiSelect?: boolean;
}) {
  const t = useTranslations("BoardComponents.cells.user");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Normalize value to array for easier handling
  const valueArray = Array.isArray(value) ? value : value ? [value] : [];
  const selectedUsers = users.filter((u) => valueArray.includes(u.id));

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    if (multiSelect) {
      // Multi-select mode
      if (valueArray.includes(userId)) {
        onChange(valueArray.filter((id) => id !== userId));
      } else {
        onChange([...valueArray, userId]);
      }
    } else {
      // Single select mode
      onChange(userId);
      setOpen(false);
      setSearch("");
    }
  };

  const clearAll = () => {
    onChange(multiSelect ? [] : "");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 text-sm text-left w-full flex-wrap",
            compact ? "py-0.5 min-h-[24px]" : "py-0.5 min-h-[28px]",
            className
          )}
        >
          {selectedUsers.length > 0 ? (
            <div className="flex items-center -space-x-1">
              {selectedUsers.slice(0, 4).map((user) => (
                <div
                  key={user.id}
                  className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-medium text-primary border-2 border-background"
                  title={user.name}
                >
                  {user.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={user.image} alt="" className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    user.name.split(" ").pop()?.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
              {selectedUsers.length > 4 && (
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground border-2 border-background">
                  +{selectedUsers.length - 4}
                </div>
              )}
              {selectedUsers.length === 1 && (
                <span className="text-xs ml-1.5">{selectedUsers[0].name}</span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground/40"></span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-1" align="start">
        <div className="space-y-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="w-full text-sm px-2 py-1.5 bg-transparent border-b outline-none focus:ring-0"
          />

          {/* Selected users tags (only for multi-select) */}
          {multiSelect && selectedUsers.length > 0 && (
            <div className="px-2 py-1 border-b">
              <div className="flex flex-wrap gap-1">
                {selectedUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20 transition-colors"
                  >
                    <span>{user.name}</span>
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className={cn(
                    "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors",
                    valueArray.includes(user.id) && "bg-accent"
                  )}
                >
                  {multiSelect && (
                    <div
                      className={cn(
                        "h-4 w-4 border rounded flex items-center justify-center flex-shrink-0",
                        valueArray.includes(user.id) ? "bg-primary border-primary" : "border-input"
                      )}
                    >
                      {valueArray.includes(user.id) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                  )}
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">
                    {user.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={user.image} alt="" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      user.name.split(" ").pop()?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="truncate font-medium">{user.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  {!multiSelect && valueArray.includes(user.id) && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                {users.length === 0 ? t("noUsers") : t("notFound")}
              </div>
            )}
          </div>

          {valueArray.length > 0 && (
            <>
              <div className="border-t my-1" />
              <button
                onClick={clearAll}
                className="w-full px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground text-left rounded hover:bg-accent transition-colors"
              >
                {t("delete")} {multiSelect && selectedUsers.length > 1 ? t("all") : ""}
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
