"use client";

import { useState, useCallback } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import {
  type Property,
  type View,
  type AggregationType,
  PropertyType,
  ViewType,
} from "@/types/board";
import { showToast } from "@/lib/toast";

// ============================================
// TYPES
// ============================================

export interface BoardData {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  ownerId: string;
  properties: Property[];
  views: View[];
  createdAt: string;
  updatedAt: string;
}

export interface SelectOption {
  id: string;
  label: string;
  color?: string;
}

interface UseBoardPropertiesOptions {
  board: BoardData;
  onBoardUpdate: (board: BoardData) => void;
}

interface UseBoardPropertiesReturn {
  properties: Property[];

  // Property CRUD
  addProperty: (property: Omit<Property, "id" | "order">, insertIndex?: number) => Promise<string>;
  updateProperty: (propertyId: string, updates: Partial<Property>) => Promise<void>;
  removeProperty: (propertyId: string) => Promise<void>;
  renameProperty: (propertyId: string, newName: string) => Promise<void>;
  reorderProperties: (oldIndex: number, newIndex: number) => Promise<void>;
  updatePropertyWidth: (propertyId: string, width: number) => Promise<void>;

  // Property Options (for select/status/multi-select)
  addPropertyOption: (propertyId: string, option: SelectOption) => Promise<void>;
  updatePropertyOption: (propertyId: string, option: SelectOption) => Promise<void>;
  removePropertyOption: (propertyId: string, optionId: string) => Promise<void>;

  // Utilities
  getPropertyById: (propertyId: string) => Property | undefined;
  getGroupableProperties: () => Property[];
}

// ============================================
// HOOK
// ============================================

export function useBoardProperties({
  board,
  onBoardUpdate,
}: UseBoardPropertiesOptions): UseBoardPropertiesReturn {
  const [properties, setProperties] = useState<Property[]>(board.properties);

  // Sync with parent
  const updateBoardAndState = useCallback(
    async (updatedProperties: Property[]) => {
      setProperties(updatedProperties);

      try {
        const res = await fetch(`/api/boards/${board._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ properties: updatedProperties }),
        });

        if (res.ok) {
          const updated = await res.json();
          onBoardUpdate({ ...board, ...updated });
        } else {
          // Revert on error
          setProperties(board.properties);
          showToast.error("Không thể cập nhật thuộc tính");
        }
      } catch (error) {
        console.error("Failed to update properties:", error);
        setProperties(board.properties);
        showToast.error("Không thể cập nhật thuộc tính");
      }
    },
    [board, onBoardUpdate]
  );

  // ============================================
  // ADD PROPERTY
  // ============================================
  const addProperty = useCallback(
    async (property: Omit<Property, "id" | "order">, insertIndex?: number) => {
      let newOrder = properties.length;
      let updatedProperties = [...properties];

      if (insertIndex !== undefined && insertIndex !== null) {
        newOrder = insertIndex;
        updatedProperties = updatedProperties.map((p) => ({
          ...p,
          order: p.order >= newOrder ? p.order + 1 : p.order,
        }));
      }

      const newProperty: Property = {
        ...property,
        id: crypto.randomUUID(),
        order: newOrder,
      };

      updatedProperties.push(newProperty);
      updatedProperties.sort((a, b) => a.order - b.order);

      await updateBoardAndState(updatedProperties);
      return newProperty.id;
    },
    [properties, updateBoardAndState]
  );

  // ============================================
  // UPDATE PROPERTY
  // ============================================
  const updateProperty = useCallback(
    async (propertyId: string, updates: Partial<Property>) => {
      const updatedProperties = properties.map((p) =>
        p.id === propertyId ? { ...p, ...updates } : p
      );
      await updateBoardAndState(updatedProperties);
    },
    [properties, updateBoardAndState]
  );

  // ============================================
  // REMOVE PROPERTY
  // ============================================
  const removeProperty = useCallback(
    async (propertyId: string) => {
      const updatedProperties = properties.filter((p) => p.id !== propertyId);
      await updateBoardAndState(updatedProperties);
    },
    [properties, updateBoardAndState]
  );

  // ============================================
  // RENAME PROPERTY
  // ============================================
  const renameProperty = useCallback(
    async (propertyId: string, newName: string) => {
      await updateProperty(propertyId, { name: newName });
    },
    [updateProperty]
  );

  // ============================================
  // REORDER PROPERTIES
  // ============================================
  const reorderProperties = useCallback(
    async (oldIndex: number, newIndex: number) => {
      if (oldIndex === newIndex) return;

      const sortedProperties = [...properties].sort((a, b) => a.order - b.order);
      const newProperties = arrayMove(sortedProperties, oldIndex, newIndex).map((p, index) => ({
        ...p,
        order: index,
      }));

      await updateBoardAndState(newProperties);
    },
    [properties, updateBoardAndState]
  );

  // ============================================
  // UPDATE PROPERTY WIDTH
  // ============================================
  const updatePropertyWidth = useCallback(
    async (propertyId: string, width: number) => {
      await updateProperty(propertyId, { width });
    },
    [updateProperty]
  );

  // ============================================
  // ADD PROPERTY OPTION
  // ============================================
  const addPropertyOption = useCallback(
    async (propertyId: string, option: SelectOption) => {
      const property = properties.find((p) => p.id === propertyId);
      if (!property) return;

      const updatedProperty = {
        ...property,
        options: [...(property.options || []), option],
      };

      const updatedProperties = properties.map((p) => (p.id === propertyId ? updatedProperty : p));

      await updateBoardAndState(updatedProperties);
    },
    [properties, updateBoardAndState]
  );

  // ============================================
  // UPDATE PROPERTY OPTION
  // ============================================
  const updatePropertyOption = useCallback(
    async (propertyId: string, updatedOption: SelectOption) => {
      const property = properties.find((p) => p.id === propertyId);
      if (!property) return;

      const updatedOptions = (property.options || []).map((opt) =>
        opt.id === updatedOption.id ? { ...opt, ...updatedOption } : opt
      );

      const updatedProperty = {
        ...property,
        options: updatedOptions,
      };

      const updatedProperties = properties.map((p) => (p.id === propertyId ? updatedProperty : p));

      await updateBoardAndState(updatedProperties);
    },
    [properties, updateBoardAndState]
  );

  // ============================================
  // REMOVE PROPERTY OPTION
  // ============================================
  const removePropertyOption = useCallback(
    async (propertyId: string, optionId: string) => {
      const property = properties.find((p) => p.id === propertyId);
      if (!property) return;

      const updatedProperty = {
        ...property,
        options: (property.options || []).filter((opt) => opt.id !== optionId),
      };

      const updatedProperties = properties.map((p) => (p.id === propertyId ? updatedProperty : p));

      await updateBoardAndState(updatedProperties);
    },
    [properties, updateBoardAndState]
  );

  // ============================================
  // GET PROPERTY BY ID
  // ============================================
  const getPropertyById = useCallback(
    (propertyId: string): Property | undefined => {
      return properties.find((p) => p.id === propertyId);
    },
    [properties]
  );

  // ============================================
  // GET GROUPABLE PROPERTIES (for Kanban)
  // ============================================
  const getGroupableProperties = useCallback((): Property[] => {
    const groupableTypes: string[] = [
      PropertyType.STATUS,
      PropertyType.SELECT,
      PropertyType.PERSON,
      PropertyType.USER,
    ];
    return properties.filter((p) => groupableTypes.includes(p.type));
  }, [properties]);

  return {
    properties,
    addProperty,
    updateProperty,
    removeProperty,
    renameProperty,
    reorderProperties,
    updatePropertyWidth,
    addPropertyOption,
    updatePropertyOption,
    removePropertyOption,
    getPropertyById,
    getGroupableProperties,
  };
}

// ============================================
// VIEW HOOK
// ============================================

interface UseBoardViewsOptions {
  board: BoardData;
  onBoardUpdate: (board: BoardData) => void;
}

interface UseBoardViewsReturn {
  views: View[];
  activeViewId: string | undefined;
  activeView: View | undefined;

  setActiveViewId: (viewId: string) => void;
  createView: (name: string, type: ViewType) => Promise<string>;
  updateViewConfig: (viewId: string, config: Partial<View["config"]>) => Promise<void>;
  updateGroupBy: (propertyId: string | undefined) => Promise<void>;
  updateAggregation: (propertyId: string, type: AggregationType | null) => Promise<void>;
  toggleColumnVisibility: (propertyId: string) => Promise<void>;
}

export function useBoardViews({ board, onBoardUpdate }: UseBoardViewsOptions): UseBoardViewsReturn {
  const [views, setViews] = useState<View[]>(board.views);
  const [activeViewId, setActiveViewId] = useState<string | undefined>(
    board.views.find((v) => v.isDefault)?.id || board.views[0]?.id
  );

  const activeView = views.find((v) => v.id === activeViewId);

  // Sync with parent
  const updateViewsAndState = useCallback(
    async (updatedViews: View[]) => {
      setViews(updatedViews);

      try {
        const res = await fetch(`/api/boards/${board._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ views: updatedViews }),
        });

        if (res.ok) {
          const updated = await res.json();
          onBoardUpdate({ ...board, ...updated });
        } else {
          setViews(board.views);
        }
      } catch (error) {
        console.error("Failed to update views:", error);
        setViews(board.views);
      }
    },
    [board, onBoardUpdate]
  );

  // ============================================
  // CREATE VIEW
  // ============================================
  const createView = useCallback(
    async (name: string, type: ViewType) => {
      let groupBy: string | undefined = undefined;

      // Ensure Kanban triggers by Status by default
      if (type === ViewType.KANBAN) {
        const statusProp = board.properties.find((p) => p.type === PropertyType.STATUS);
        if (statusProp) {
          groupBy = statusProp.id;
        }
      }

      const newView: View = {
        id: crypto.randomUUID(),
        name,
        type,
        isDefault: false,
        config: {
          visibleProperties: board.properties.map((p) => p.id),
          groupBy,
        },
      };

      const updatedViews = [...views, newView];
      await updateViewsAndState(updatedViews);
      setActiveViewId(newView.id);
      return newView.id;
    },
    [views, board.properties, updateViewsAndState]
  );

  // ============================================
  // UPDATE VIEW CONFIG
  // ============================================
  const updateViewConfig = useCallback(
    async (viewId: string, config: Partial<View["config"]>) => {
      const view = views.find((v) => v.id === viewId);
      if (!view) return;

      const updatedView = {
        ...view,
        config: { ...view.config, ...config },
      };

      const updatedViews = views.map((v) => (v.id === viewId ? updatedView : v));
      await updateViewsAndState(updatedViews);
    },
    [views, updateViewsAndState]
  );

  // ============================================
  // UPDATE GROUP BY
  // ============================================
  const updateGroupBy = useCallback(
    async (propertyId: string | undefined) => {
      if (!activeView) return;
      await updateViewConfig(activeView.id, { groupBy: propertyId });
    },
    [activeView, updateViewConfig]
  );

  // ============================================
  // UPDATE AGGREGATION
  // ============================================
  const updateAggregation = useCallback(
    async (propertyId: string, type: AggregationType | null) => {
      if (!activeView) return;

      const currentAggregations = activeView.config.aggregations || [];
      let newAggregations;

      if (type === null) {
        newAggregations = currentAggregations.filter((a) => a.propertyId !== propertyId);
      } else {
        const existingIndex = currentAggregations.findIndex((a) => a.propertyId === propertyId);
        if (existingIndex >= 0) {
          newAggregations = [...currentAggregations];
          newAggregations[existingIndex] = { propertyId, type };
        } else {
          newAggregations = [...currentAggregations, { propertyId, type }];
        }
      }

      await updateViewConfig(activeView.id, { aggregations: newAggregations });
    },
    [activeView, updateViewConfig]
  );

  // ============================================
  // TOGGLE COLUMN VISIBILITY
  // ============================================
  const toggleColumnVisibility = useCallback(
    async (propertyId: string) => {
      if (!activeView) return;

      const currentVisible =
        activeView.config.visibleProperties || board.properties.map((p) => p.id);
      let newVisible;

      if (currentVisible.includes(propertyId)) {
        newVisible = currentVisible.filter((id) => id !== propertyId);
      } else {
        newVisible = [...currentVisible, propertyId];
      }

      await updateViewConfig(activeView.id, { visibleProperties: newVisible });
    },
    [activeView, board.properties, updateViewConfig]
  );

  return {
    views,
    activeViewId,
    activeView,
    setActiveViewId,
    createView,
    updateViewConfig,
    updateGroupBy,
    updateAggregation,
    toggleColumnVisibility,
  };
}
