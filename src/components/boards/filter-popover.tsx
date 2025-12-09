"use client";

import { useState, type ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Property, PropertyType, type FilterConfig } from "@/types/board";

interface FilterPopoverProps {
  children: ReactNode;
  properties: Property[];
  filters: FilterConfig[];
  onAddFilter: (filter: FilterConfig) => void;
  onRemoveFilter: (index: number) => void;
  onClearFilters: () => void;
}

import { useTranslations } from "next-intl";

// ... (imports remain)

export function FilterPopover({
  children,
  properties,
  filters,
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
}: FilterPopoverProps) {
  const t = useTranslations("BoardComponents.filter");
  const [open, setOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [operator, setOperator] = useState<string>("contains");
  const [value, setValue] = useState<string>("");

  const OPERATORS = {
    text: [
      { value: "contains", label: t("operators.contains") },
      { value: "equals", label: t("operators.equals") },
      { value: "not_equals", label: t("operators.not_equals") },
      { value: "is_empty", label: t("operators.is_empty") },
      { value: "is_not_empty", label: t("operators.is_not_empty") },
    ],
    number: [
      { value: "equals", label: t("operators.equals") },
      { value: "not_equals", label: t("operators.not_equals") },
      { value: "greater_than", label: t("operators.greater_than") },
      { value: "less_than", label: t("operators.less_than") },
      { value: "greater_or_equal", label: t("operators.greater_or_equal") },
      { value: "less_or_equal", label: t("operators.less_or_equal") },
    ],
    date: [
      { value: "equals", label: t("operators.equals") },
      { value: "before", label: t("operators.before") },
      { value: "after", label: t("operators.after") },
      { value: "is_empty", label: t("operators.is_empty") },
      { value: "is_not_empty", label: t("operators.is_not_empty") },
    ],
    select: [
      { value: "equals", label: t("operators.equals") },
      { value: "not_equals", label: t("operators.not_equals") },
      { value: "is_empty", label: t("operators.is_empty") },
      { value: "is_not_empty", label: t("operators.is_not_empty") },
    ],
    checkbox: [{ value: "equals", label: t("operators.equals") }],
  };

  function getOperatorsForType(type: PropertyType) {
    switch (type) {
      case PropertyType.NUMBER:
      case PropertyType.CURRENCY:
        return OPERATORS.number;
      case PropertyType.DATE:
        return OPERATORS.date;
      case PropertyType.SELECT:
      case PropertyType.MULTI_SELECT:
      case PropertyType.STATUS:
        return OPERATORS.select;
      case PropertyType.CHECKBOX:
        return OPERATORS.checkbox;
      default:
        return OPERATORS.text;
    }
  }

  const selectedProp = properties.find((p) => p.id === selectedProperty);
  const operators = selectedProp ? getOperatorsForType(selectedProp.type) : OPERATORS.text;
  const needsValue = !["is_empty", "is_not_empty"].includes(operator);

  const handleAddFilter = () => {
    if (!selectedProperty) return;
    if (needsValue && !value.trim()) return;

    onAddFilter({
      propertyId: selectedProperty,
      operator: operator as FilterConfig["operator"],
      value: needsValue ? value : undefined,
    });

    // Reset
    setSelectedProperty("");
    setOperator("contains");
    setValue("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{t("title")}</h4>
            {filters.length > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onClearFilters}>
                {t("clearAll")}
              </Button>
            )}
          </div>

          {/* Existing filters */}
          {filters.length > 0 && (
            <div className="space-y-1.5">
              {filters.map((filter, index) => {
                const prop = properties.find((p) => p.id === filter.propertyId);
                const ops = prop ? getOperatorsForType(prop.type) : OPERATORS.text;
                const opLabel = ops.find((o) => o.value === filter.operator)?.label;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 text-sm bg-accent/50 rounded px-2 py-1"
                  >
                    <span className="font-medium">{prop?.name}</span>
                    <span className="text-muted-foreground">{opLabel}</span>
                    {filter.value !== undefined && (
                      <span className="truncate">{String(filter.value)}</span>
                    )}
                    <button
                      onClick={() => onRemoveFilter(index)}
                      className="ml-auto text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add new filter */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground">{t("addFilter")}</p>

            {/* Property select */}
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder={t("selectColumn")} />
              </SelectTrigger>
              <SelectContent>
                {properties.map((prop) => (
                  <SelectItem key={prop.id} value={prop.id}>
                    {prop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedProperty && (
              <>
                {/* Operator select */}
                <Select value={operator} onValueChange={setOperator}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Value input */}
                {needsValue && (
                  <>
                    {selectedProp?.type === PropertyType.SELECT ||
                    selectedProp?.type === PropertyType.MULTI_SELECT ||
                    selectedProp?.type === PropertyType.STATUS ? (
                      <Select value={value} onValueChange={setValue}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder={t("selectValue")} />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedProp.options?.map((opt) => (
                            <SelectItem key={opt.id} value={opt.label}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : selectedProp?.type === PropertyType.CHECKBOX ? (
                      <Select value={value} onValueChange={setValue}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder={t("select")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">{t("true")}</SelectItem>
                          <SelectItem value="false">{t("false")}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : selectedProp?.type === PropertyType.DATE ? (
                      <Input
                        type="date"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="h-8 text-sm"
                      />
                    ) : (
                      <Input
                        type={
                          selectedProp?.type === PropertyType.NUMBER ||
                          selectedProp?.type === PropertyType.CURRENCY
                            ? "number"
                            : "text"
                        }
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={t("enterValue")}
                        className="h-8 text-sm"
                      />
                    )}
                  </>
                )}

                {/* Add button */}
                <Button
                  size="sm"
                  className="w-full h-8"
                  onClick={handleAddFilter}
                  disabled={needsValue && !value.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t("addFilter")}
                </Button>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
