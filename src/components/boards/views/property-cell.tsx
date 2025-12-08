"use client";

import { type Property, PropertyType } from "@/types/board";
import { TextCell } from "@/components/boards/cells/text-cell";
import { NumberCell, CurrencyCell } from "@/components/boards/cells/number-cell";
import { DateCell } from "@/components/boards/cells/date-cell";
import {
  SelectCell,
  MultiSelectCell,
  type SelectOption,
} from "@/components/boards/cells/select-cell";
import { CheckboxCell } from "@/components/boards/cells/checkbox-cell";
import { UserCell, type UserOption } from "@/components/boards/cells/user-cell";
import { AttachmentCell, type AttachmentFile } from "@/components/boards/cells/attachment-cell";

interface PropertyCellProps {
  property: Property;
  value: unknown;
  onChange: (value: unknown) => void;
  onAddOption?: (propertyId: string, option: SelectOption) => void;
  onUpdateOption?: (propertyId: string, option: SelectOption) => void;
  users?: UserOption[];
  compact?: boolean;
  className?: string;
}

export function PropertyCell({
  property,
  value,
  onChange,
  onAddOption,
  onUpdateOption,
  users = [],
  compact = false,
  className,
}: PropertyCellProps) {
  switch (property.type) {
    case PropertyType.TEXT:
      return (
        <TextCell
          value={value as string}
          onChange={onChange}
          compact={compact}
          className={className}
        />
      );

    case PropertyType.NUMBER:
      return (
        <NumberCell
          value={value as number}
          onChange={onChange}
          compact={compact}
          className={className}
        />
      );

    case PropertyType.DATE:
      return (
        <DateCell
          value={value as string}
          onChange={onChange}
          compact={compact}
          className={className}
        />
      );

    case PropertyType.SELECT:
    case PropertyType.STATUS:
      return (
        <SelectCell
          value={value as string}
          options={property.options || []}
          onChange={onChange}
          onAddOption={onAddOption ? (opt) => onAddOption(property.id, opt) : undefined}
          onUpdateOption={onUpdateOption ? (opt) => onUpdateOption(property.id, opt) : undefined}
          compact={compact}
          className={className}
        />
      );

    case PropertyType.MULTI_SELECT:
      return (
        <MultiSelectCell
          value={(value as string[]) || []}
          options={property.options || []}
          onChange={onChange}
          onAddOption={onAddOption ? (opt) => onAddOption(property.id, opt) : undefined}
          onUpdateOption={onUpdateOption ? (opt) => onUpdateOption(property.id, opt) : undefined}
          compact={compact}
          className={className}
        />
      );

    case PropertyType.CURRENCY:
      return (
        <CurrencyCell
          value={value as number}
          onChange={onChange}
          compact={compact}
          className={className}
        />
      );

    case PropertyType.CHECKBOX:
      return <CheckboxCell value={value as boolean} onChange={onChange} className={className} />;

    case PropertyType.PERSON:
      return (
        <UserCell
          value={value as string}
          users={users}
          onChange={onChange}
          compact={compact}
          className={className}
          multiSelect={false}
        />
      );

    case PropertyType.USER:
      return (
        <UserCell
          value={value as string | string[]}
          users={users}
          onChange={onChange}
          compact={compact}
          className={className}
          multiSelect={true}
        />
      );

    case PropertyType.ATTACHMENT:
      return (
        <AttachmentCell
          value={(value as AttachmentFile[]) || []}
          onChange={onChange}
          compact={compact}
          className={className}
        />
      );

    default:
      return (
        <TextCell
          value={value as string}
          onChange={onChange}
          compact={compact}
          className={className}
        />
      );
  }
}
