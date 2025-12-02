"use client";

import { useState, type ReactNode } from "react";
import { Plus, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

const OPERATORS = {
  text: [
    { value: "contains", label: "Chứa" },
    { value: "equals", label: "Bằng" },
    { value: "not_equals", label: "Không bằng" },
    { value: "is_empty", label: "Trống" },
    { value: "is_not_empty", label: "Không trống" },
  ],
  number: [
    { value: "equals", label: "=" },
    { value: "not_equals", label: "≠" },
    { value: "greater_than", label: ">" },
    { value: "less_than", label: "<" },
    { value: "greater_or_equal", label: "≥" },
    { value: "less_or_equal", label: "≤" },
  ],
  date: [
    { value: "equals", label: "Bằng" },
    { value: "before", label: "Trước" },
    { value: "after", label: "Sau" },
    { value: "is_empty", label: "Trống" },
    { value: "is_not_empty", label: "Không trống" },
  ],
  select: [
    { value: "equals", label: "Là" },
    { value: "not_equals", label: "Không là" },
    { value: "is_empty", label: "Trống" },
    { value: "is_not_empty", label: "Không trống" },
  ],
  checkbox: [
    { value: "equals", label: "Là" },
  ],
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

export function FilterPopover({
  children,
  properties,
  filters,
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [operator, setOperator] = useState<string>("contains");
  const [value, setValue] = useState<string>("");

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
            <h4 className="font-medium text-sm">Bộ lọc</h4>
            {filters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={onClearFilters}
              >
                Xóa tất cả
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
            <p className="text-xs text-muted-foreground">Thêm bộ lọc</p>

            {/* Property select */}
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Chọn cột..." />
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
                          <SelectValue placeholder="Chọn giá trị..." />
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
                          <SelectValue placeholder="Chọn..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Có</SelectItem>
                          <SelectItem value="false">Không</SelectItem>
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
                        placeholder="Nhập giá trị..."
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
                  Thêm bộ lọc
                </Button>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
