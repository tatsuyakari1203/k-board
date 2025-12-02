import { z } from "zod";

// ============================================
// ENUMS
// ============================================

export const PropertyType = {
  TEXT: "text",
  NUMBER: "number",
  DATE: "date",
  SELECT: "select",
  MULTI_SELECT: "multi-select",
  PERSON: "person",
  STATUS: "status",
  CURRENCY: "currency",
  CHECKBOX: "checkbox",
  RICH_TEXT: "rich-text", // Lexical editor
  ATTACHMENT: "attachment", // Files/images
  USER: "user", // Assign to user
} as const;

export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export const ViewType = {
  TABLE: "table",
  KANBAN: "kanban",
} as const;

export type ViewType = (typeof ViewType)[keyof typeof ViewType];

// ============================================
// PROPERTY OPTION (for select, status, multi-select)
// ============================================

export const propertyOptionSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  color: z.string().optional(), // Tailwind color class
});

export type PropertyOption = z.infer<typeof propertyOptionSchema>;

// ============================================
// PROPERTY DEFINITION
// ============================================

export const propertySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.nativeEnum(PropertyType),
  options: z.array(propertyOptionSchema).optional(), // For select types
  order: z.number().int().min(0),
  required: z.boolean().optional().default(false),
  width: z.number().int().min(50).optional(), // Column width in pixels
});

export type Property = z.infer<typeof propertySchema>;

// ============================================
// VIEW CONFIG
// ============================================

export const filterOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "is_empty",
  "is_not_empty",
  "greater_than",
  "less_than",
  "greater_or_equal",
  "less_or_equal",
  "before",
  "after",
]);

export type FilterOperator = z.infer<typeof filterOperatorSchema>;

export const filterSchema = z.object({
  propertyId: z.string(),
  operator: filterOperatorSchema,
  value: z.unknown().optional(),
});

export type Filter = z.infer<typeof filterSchema>;
export type FilterConfig = Filter; // Alias for component usage

export const sortSchema = z.object({
  propertyId: z.string(),
  direction: z.enum(["asc", "desc"]),
});

export type Sort = z.infer<typeof sortSchema>;
export type SortConfig = Sort; // Alias for component usage

export const AggregationType = {
  COUNT: "count",
  COUNT_EMPTY: "count_empty",
  COUNT_NOT_EMPTY: "count_not_empty",
  PERCENT_EMPTY: "percent_empty",
  PERCENT_NOT_EMPTY: "percent_not_empty",
  SUM: "sum",
  AVERAGE: "average",
  MEDIAN: "median",
  MIN: "min",
  MAX: "max",
  RANGE: "range",
} as const;

export type AggregationType = (typeof AggregationType)[keyof typeof AggregationType];

export const aggregationSchema = z.object({
  propertyId: z.string(),
  type: z.nativeEnum(AggregationType),
});

export type Aggregation = z.infer<typeof aggregationSchema>;
export type AggregationConfig = Aggregation;

export const viewConfigSchema = z.object({
  groupBy: z.string().uuid().optional(), // For Kanban or Table grouping
  sortBy: z.array(sortSchema).optional(),
  filters: z.array(filterSchema).optional(),
  visibleProperties: z.array(z.string()).optional(),
  aggregations: z.array(aggregationSchema).optional(),
});

export type ViewConfig = z.infer<typeof viewConfigSchema>;

export const viewSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.nativeEnum(ViewType),
  config: viewConfigSchema,
  isDefault: z.boolean().default(false),
});

export type View = z.infer<typeof viewSchema>;

// ============================================
// BOARD
// ============================================

export const boardSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  icon: z.string().optional(), // Emoji or icon name
  ownerId: z.string(),
  properties: z.array(propertySchema),
  views: z.array(viewSchema),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Board = z.infer<typeof boardSchema>;

// Create/Update schemas
export const createBoardSchema = boardSchema.omit({
  _id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;

export const updateBoardSchema = createBoardSchema.partial();

export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;

// ============================================
// TASK
// ============================================

export const taskSchema = z.object({
  _id: z.string().optional(),
  boardId: z.string(),
  title: z.string().max(500).default(""),
  properties: z.record(z.string(), z.unknown()), // { propertyId: value }
  order: z.number().int().min(0),
  createdBy: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Task = z.infer<typeof taskSchema>;

// Create/Update schemas
export const createTaskSchema = taskSchema.omit({
  _id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial().omit({
  boardId: true,
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// ============================================
// API RESPONSE TYPES
// ============================================

export interface BoardWithTasks extends Board {
  tasks: Task[];
}

export interface BoardListItem {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  taskCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// DEFAULT TEMPLATES
// ============================================

export const DEFAULT_STATUS_OPTIONS: PropertyOption[] = [
  { id: crypto.randomUUID(), label: "Mới", color: "bg-gray-100 text-gray-800" },
  {
    id: crypto.randomUUID(),
    label: "Đang xử lý",
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: crypto.randomUUID(),
    label: "Hoàn thành",
    color: "bg-green-100 text-green-800",
  },
];

// Template type for creating properties without id
type PropertyTemplate = Omit<Property, "id" | "required"> & { required?: boolean };

export const DEFAULT_SURVEY_PROPERTIES: PropertyTemplate[] = [
  { name: "Tên khách hàng", type: PropertyType.TEXT, order: 0, required: true },
  { name: "Địa chỉ thửa đất", type: PropertyType.TEXT, order: 1, required: true },
  {
    name: "Mục đích đo",
    type: PropertyType.SELECT,
    order: 2,
    options: [
      { id: crypto.randomUUID(), label: "Tách thửa", color: "bg-purple-100 text-purple-800" },
      { id: crypto.randomUUID(), label: "Cấp GCN", color: "bg-orange-100 text-orange-800" },
      { id: crypto.randomUUID(), label: "Khác", color: "bg-gray-100 text-gray-800" },
    ],
  },
  { name: "Ngày nhận hồ sơ", type: PropertyType.DATE, order: 3 },
  { name: "Ngày đo thực địa", type: PropertyType.DATE, order: 4 },
  { name: "Kỹ thuật viên", type: PropertyType.PERSON, order: 5 },
  {
    name: "Trạng thái",
    type: PropertyType.STATUS,
    order: 6,
    options: DEFAULT_STATUS_OPTIONS,
  },
  { name: "Ngày hoàn thành bản vẽ", type: PropertyType.DATE, order: 7 },
  { name: "Ngày nộp VPĐKĐĐ", type: PropertyType.DATE, order: 8 },
  { name: "Ngày trả kết quả", type: PropertyType.DATE, order: 9 },
  { name: "Phí dịch vụ", type: PropertyType.CURRENCY, order: 10 },
  { name: "Đã thu", type: PropertyType.CURRENCY, order: 11 },
  { name: "Còn lại", type: PropertyType.CURRENCY, order: 12 },
  { name: "Ghi chú", type: PropertyType.RICH_TEXT, order: 13 },
];
