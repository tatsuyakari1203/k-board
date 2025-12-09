"use client";

import { useState } from "react";
import { Plus, Filter, ArrowUpDown, MoreHorizontal, Search, X, Layers, Eye } from "lucide-react";
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

import { useTranslations } from "next-intl";

export function BoardToolbar({
  properties,
  filters,
  sorts,
  groupBy,
  visibleProperties,
  searchQuery,
  onSearchChange,
  onAddPropertyClick,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRemoveProperty,
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
  onAddSort,
  onRemoveSort,
  onClearSorts,
  onGroupByChange,
  onToggleColumnVisibility,
}: BoardToolbarProps) {
  const t = useTranslations("BoardDetails.toolbar");
  const [showSearch, setShowSearch] = useState(false);

  const groupableProperties = properties.filter((p) =>
    (
      [PropertyType.SELECT, PropertyType.STATUS, PropertyType.PERSON, PropertyType.USER] as string[]
    ).includes(p.type)
  );

  return (
    <div className="flex flex-col gap-1.5 px-4 py-1.5 border-b border-border/40">
      {/* Main toolbar row */}
      <div className="flex items-center gap-0.5 flex-wrap">
        {/* Filter button */}
        <FilterPopover
          properties={properties}
          filters={filters}
          onAddFilter={onAddFilter}
          onRemoveFilter={onRemoveFilter}
          onClearFilters={onClearFilters}
        >
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 text-xs gap-1 px-2 ${filters.length > 0 ? "text-foreground" : "text-muted-foreground"}`}
          >
            <Filter className="h-3 w-3" />
            <span className="hidden sm:inline">{t("filter")}</span>
            {filters.length > 0 && (
              <span className="bg-muted text-foreground px-1 rounded text-[10px]">
                {filters.length}
              </span>
            )}
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
            variant="ghost"
            size="sm"
            className={`h-6 text-xs gap-1 px-2 ${sorts.length > 0 ? "text-foreground" : "text-muted-foreground"}`}
          >
            <ArrowUpDown className="h-3 w-3" />
            <span className="hidden sm:inline">{t("sort")}</span>
            {sorts.length > 0 && (
              <span className="bg-muted text-foreground px-1 rounded text-[10px]">
                {sorts.length}
              </span>
            )}
          </Button>
        </SortPopover>

        {/* Group button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 text-xs gap-1 px-2 ${groupBy ? "text-foreground" : "text-muted-foreground"}`}
            >
              <Layers className="h-3 w-3" />
              <span className="hidden sm:inline">{t("group")}</span>
              {groupBy && (
                <span className="bg-muted text-foreground px-1 rounded text-[10px]">1</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => onGroupByChange(undefined)} className="text-xs">
              {t("noGrouping")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {groupableProperties.map((prop) => (
              <DropdownMenuCheckboxItem
                key={prop.id}
                checked={groupBy === prop.id}
                onCheckedChange={(checked) => onGroupByChange(checked ? prop.id : undefined)}
                className="text-xs"
              >
                {prop.name}
              </DropdownMenuCheckboxItem>
            ))}
            {groupableProperties.length === 0 && (
              <div className="p-2 text-[10px] text-muted-foreground text-center">
                {t("noGroupable")}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Columns Visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1 px-2 text-muted-foreground"
            >
              <Eye className="h-3 w-3" />
              <span className="hidden sm:inline">{t("properties")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 max-h-[280px] overflow-y-auto">
            <DropdownMenuLabel className="text-xs">{t("showColumns")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={!visibleProperties || visibleProperties.includes("title")}
              onCheckedChange={() => onToggleColumnVisibility("title")}
              className="text-xs"
            >
              {t("titleColumn")}
            </DropdownMenuCheckboxItem>
            {properties.map((prop) => (
              <DropdownMenuCheckboxItem
                key={prop.id}
                checked={!visibleProperties || visibleProperties.includes(prop.id)}
                onCheckedChange={() => onToggleColumnVisibility(prop.id)}
                className="text-xs"
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
          className="h-6 text-xs gap-1 px-2 text-muted-foreground md:hidden"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search className="h-3 w-3" />
        </Button>

        {/* Search input - desktop */}
        <div className="hidden md:flex items-center relative ml-auto">
          <Search className="absolute left-1.5 h-3 w-3 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("search")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-6 w-40 pl-6 text-xs border-0 bg-muted/50 focus-visible:ring-0"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>

        <div className="flex-1 md:hidden" />

        {/* Add property */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs gap-1 px-2 text-muted-foreground"
          onClick={onAddPropertyClick}
        >
          <Plus className="h-3 w-3" />
          <span className="hidden sm:inline">{t("newColumn")}</span>
        </Button>

        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={onClearFilters}
              disabled={filters.length === 0}
              className="text-xs"
            >
              {t("clearFilters")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onClearSorts}
              disabled={sorts.length === 0}
              className="text-xs"
            >
              {t("clearSorting")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile search row */}
      {showSearch && (
        <div className="flex items-center relative md:hidden">
          <Search className="absolute left-2 h-3 w-3 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("search")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-7 pl-6 text-xs w-full"
            autoFocus
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
      )}

      {/* Active filters display */}
      {(filters.length > 0 || sorts.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {filters.map((filter, index) => {
            const prop = properties.find((p) => p.id === filter.propertyId);
            return (
              <span
                key={`filter-${index}`}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-muted text-[10px] rounded"
              >
                <span className="text-muted-foreground">{prop?.name}:</span>
                <span>{String(filter.value)}</span>
                <button
                  onClick={() => onRemoveFilter(index)}
                  className="text-muted-foreground hover:text-foreground ml-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            );
          })}
          {sorts.map((sort, index) => {
            const prop = properties.find((p) => p.id === sort.propertyId);
            return (
              <span
                key={`sort-${index}`}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-muted text-[10px] rounded"
              >
                <ArrowUpDown className="h-2.5 w-2.5" />
                <span>{prop?.name}</span>
                <span className="text-muted-foreground">
                  {sort.direction === "asc" ? "↑" : "↓"}
                </span>
                <button
                  onClick={() => onRemoveSort(index)}
                  className="text-muted-foreground hover:text-foreground ml-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
