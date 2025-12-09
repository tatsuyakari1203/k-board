"use client";

import { useState, type ReactNode } from "react";
import { Plus, X, ArrowUp, ArrowDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Property, type SortConfig } from "@/types/board";

interface SortPopoverProps {
  children: ReactNode;
  properties: Property[];
  sorts: SortConfig[];
  onAddSort: (sort: SortConfig) => void;
  onRemoveSort: (index: number) => void;
  onClearSorts: () => void;
}

import { useTranslations } from "next-intl";

// ... (imports remain)

export function SortPopover({
  children,
  properties,
  sorts,
  onAddSort,
  onRemoveSort,
  onClearSorts,
}: SortPopoverProps) {
  const t = useTranslations("BoardComponents.sort");
  const [open, setOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  // Filter out already sorted properties
  const availableProperties = properties.filter((p) => !sorts.some((s) => s.propertyId === p.id));

  const handleAddSort = () => {
    if (!selectedProperty) return;

    onAddSort({
      propertyId: selectedProperty,
      direction,
    });

    // Reset
    setSelectedProperty("");
    setDirection("asc");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{t("title")}</h4>
            {sorts.length > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onClearSorts}>
                {t("clearAll")}
              </Button>
            )}
          </div>

          {/* Existing sorts */}
          {sorts.length > 0 && (
            <div className="space-y-1.5">
              {sorts.map((sort, index) => {
                const prop = properties.find((p) => p.id === sort.propertyId);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm bg-accent/50 rounded px-2 py-1.5"
                  >
                    <span className="font-medium flex-1 truncate">{prop?.name}</span>
                    <button
                      onClick={() =>
                        onAddSort({
                          propertyId: sort.propertyId,
                          direction: sort.direction === "asc" ? "desc" : "asc",
                        })
                      }
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {sort.direction === "asc" ? (
                        <>
                          <ArrowUp className="h-3 w-3" />
                          <span>{t("asc")}</span>
                        </>
                      ) : (
                        <>
                          <ArrowDown className="h-3 w-3" />
                          <span>{t("desc")}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => onRemoveSort(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add new sort */}
          {availableProperties.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground">{t("addSort")}</p>

              <div className="flex gap-2">
                {/* Property select */}
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger className="h-8 text-sm flex-1">
                    <SelectValue placeholder={t("selectColumn")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProperties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {prop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Direction */}
                <Select value={direction} onValueChange={(v) => setDirection(v as "asc" | "desc")}>
                  <SelectTrigger className="h-8 text-sm w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">
                      <div className="flex items-center gap-1">
                        <ArrowUp className="h-3 w-3" />
                        <span>{t("ascShort")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="desc">
                      <div className="flex items-center gap-1">
                        <ArrowDown className="h-3 w-3" />
                        <span>{t("descShort")}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Add button */}
              <Button
                size="sm"
                className="w-full h-8"
                onClick={handleAddSort}
                disabled={!selectedProperty}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("add")}
              </Button>
            </div>
          )}

          {availableProperties.length === 0 && sorts.length > 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">{t("allSorted")}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
