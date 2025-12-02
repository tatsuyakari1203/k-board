"use client";

import { useState } from "react";
import {
  Plus,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Search,
  X,
  Layers,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { type Property, type SortConfig, type FilterConfig, PropertyType } from "@/types/board";
import { FilterPopover } from "./filter-popover";
import { SortPopover } from "./sort-popover";

interface BoardToolbarProps {
  properties: Property[];
  filters: FilterConfig[];
  sorts: SortConfig[];
  groupBy?: string;
  visibleProperties?: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddPropertyClick: () => void;
  onRemoveProperty: (propertyId: string) => void;
  onAddFilter: (filter: FilterConfig) => void;
  onRemoveFilter: (index: number) => void;
  onClearFilters: () => void;
  onAddSort: (sort: SortConfig) => void;
  onRemoveSort: (index: number) => void;
  onClearSorts: () => void;
  onGroupByChange: (propertyId: string | undefined) => void;
  onToggleColumnVisibility: (propertyId: string) => void;
}

export function BoardToolbar({
  properties,
  filters,
  sorts,
  groupBy,
  visibleProperties,
  searchQuery,
  onSearchChange,
  onAddPropertyClick,
  onRemoveProperty: _onRemoveProperty,
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
  onAddSort,
  onRemoveSort,
  onClearSorts,
  onGroupByChange,
  onToggleColumnVisibility,
}: BoardToolbarProps) {
  const [showSearch, setShowSearch] = useState(false);

  const groupableProperties = properties.filter(p =>
    ([PropertyType.SELECT, PropertyType.STATUS, PropertyType.PERSON, PropertyType.USER] as string[]).includes(p.type)
  );

  return (
    <div className="flex flex-col gap-2 px-4 py-2 border-b md:px-6">
      {/* Main toolbar row */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Filter button */}
        <FilterPopover
          properties={properties}
          filters={filters}
          onAddFilter={onAddFilter}
          onRemoveFilter={onRemoveFilter}
          onClearFilters={onClearFilters}
        >
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={`h-7 text-xs gap-1.5 ${filters.length > 0 ? "text-primary" : ""}`}
          >
            <div role="button" tabIndex={0}>
              <Filter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lọc</span>
              {filters.length > 0 && (
                <span className="bg-primary/20 text-primary px-1.5 rounded-full text-xs">
                  {filters.length}
                </span>
              )}
            </div>
          </Button>
        </FilterPopover>

        {/* Sort button */}
        <SortPopover
          properties={properties}
          sorts={sorts}
          onAddSort={onAddSort}
          onRemoveSort={onRemoveSort}
          onClearSorts={onClearSorts}
        >
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={`h-7 text-xs gap-1.5 ${sorts.length > 0 ? "text-primary" : ""}`}
          >
            <div role="button" tabIndex={0}>
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sắp xếp</span>
              {sorts.length > 0 && (
                <span className="bg-primary/20 text-primary px-1.5 rounded-full text-xs">
                  {sorts.length}
                </span>
              )}
            </div>
          </Button>
        </SortPopover>

        {/* Group button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={`h-7 text-xs gap-1.5 ${groupBy ? "text-primary" : ""}`}
            >
              <div role="button" tabIndex={0}>
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Nhóm</span>
                {groupBy && (
                  <span className="bg-primary/20 text-primary px-1.5 rounded-full text-xs">
                    1
                  </span>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => onGroupByChange(undefined)}>
              Không nhóm
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {groupableProperties.map((prop) => (
              <DropdownMenuCheckboxItem
                key={prop.id}
                checked={groupBy === prop.id}
                onCheckedChange={(checked) => onGroupByChange(checked ? prop.id : undefined)}
              >
                {prop.name}
              </DropdownMenuCheckboxItem>
            ))}
            {groupableProperties.length === 0 && (
              <div className="p-2 text-xs text-muted-foreground text-center">
                Không có thuộc tính để nhóm
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Columns Visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5"
            >
              <div role="button" tabIndex={0}>
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Hiển thị</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-y-auto">
            <DropdownMenuLabel>Hiển thị cột</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
                checked={!visibleProperties || visibleProperties.includes("title")}
                onCheckedChange={() => onToggleColumnVisibility("title")}
            >
                Tiêu đề
            </DropdownMenuCheckboxItem>
            {properties.map((prop) => (
              <DropdownMenuCheckboxItem
                key={prop.id}
                checked={!visibleProperties || visibleProperties.includes(prop.id)}
                onCheckedChange={() => onToggleColumnVisibility(prop.id)}
              >
                {prop.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search toggle - mobile */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1.5 md:hidden"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search className="h-3.5 w-3.5" />
        </Button>

        {/* Search input - desktop */}
        <div className="hidden md:flex items-center relative ml-auto">
          <Search className="absolute left-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-7 w-48 pl-7 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex-1 md:hidden" />

        {/* Add property */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={onAddPropertyClick}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Thêm cột</span>
        </Button>

        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0">
              <div role="button" tabIndex={0}>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClearFilters} disabled={filters.length === 0}>
              Xóa tất cả bộ lọc
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onClearSorts} disabled={sorts.length === 0}>
              Xóa sắp xếp
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile search row */}
      {showSearch && (
        <div className="flex items-center relative md:hidden">
          <Search className="absolute left-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-7 text-sm w-full"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Active filters display */}
      {(filters.length > 0 || sorts.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {filters.map((filter, index) => {
            const prop = properties.find((p) => p.id === filter.propertyId);
            return (
              <span
                key={`filter-${index}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent text-xs rounded-full"
              >
                <span className="text-muted-foreground">{prop?.name}:</span>
                <span>{String(filter.value)}</span>
                <button
                  onClick={() => onRemoveFilter(index)}
                  className="text-muted-foreground hover:text-foreground ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          {sorts.map((sort, index) => {
            const prop = properties.find((p) => p.id === sort.propertyId);
            return (
              <span
                key={`sort-${index}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent text-xs rounded-full"
              >
                <ArrowUpDown className="h-3 w-3" />
                <span>{prop?.name}</span>
                <span className="text-muted-foreground">
                  {sort.direction === "asc" ? "↑" : "↓"}
                </span>
                <button
                  onClick={() => onRemoveSort(index)}
                  className="text-muted-foreground hover:text-foreground ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
