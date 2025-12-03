# Plan Triển Khai Kanban View

## 📊 Tổng Quan Tính Năng Table View Hiện Tại

### 1. Property Types (12 loại)
| Type | Mô tả | Cell Component |
|------|-------|----------------|
| `text` | Text đơn giản, auto-resize | `TextCell` - textarea tự động mở rộng |
| `number` | Số | `NumberCell` - input type number |
| `date` | Ngày/khoảng thời gian | `DateCell` - Calendar picker + time + range |
| `select` | Chọn 1 option | `SelectCell` - Popover với options |
| `multi-select` | Chọn nhiều options | `MultiSelectCell` - Popover với checkboxes |
| `status` | Giống select (styling khác) | `SelectCell` |
| `person` | Chọn 1 user | `UserCell` - Search + select |
| `user` | Chọn nhiều users | `UserCell` với multiSelect |
| `currency` | Tiền tệ VNĐ | `CurrencyCell` - Format số + đơn vị |
| `checkbox` | Boolean | `CheckboxCell` |
| `rich-text` | Text phức tạp | (Chưa implement, fallback TextCell) |
| `attachment` | Upload files | `AttachmentCell` - Upload + preview |

### 2. View Features
- **Search**: Tìm kiếm trong title và text properties
- **Filter**: Hỗ trợ nhiều operators (equals, contains, is_empty, greater_than, before, after...)
- **Sort**: Multi-column sorting, asc/desc
- **Group By**: Nhóm theo select/status/person property
- **Aggregation**: Count, Sum, Average, Min, Max, Median, Range per column
- **Column Operations**:
  - Drag & drop reorder columns
  - Resize columns
  - Rename columns
  - Add column at position
  - Remove column
  - Hide/show columns (via visibleProperties)

### 3. Row Features
- **Drag & drop reorder** (disabled khi có filter/sort/group)
- **Multi-select** với checkbox
- **Bulk delete**
- **Fill Handle** (kéo giá trị xuống như Excel)
- **Inline editing** cho tất cả cells

### 4. Mobile Support
- Card view layout cho mobile
- Hiển thị 6 properties đầu tiên
- Expandable cho các properties còn lại

---

## 🎯 Kanban View - Mục Tiêu

### Nguyên tắc thiết kế
1. **Tái sử dụng tối đa**: Dùng lại `PropertyCell` và tất cả cell components
2. **Consistent UX**: Cùng logic filter/sort với Table
3. **Responsive**: Desktop columns → Mobile stacks
4. **Performance**: Virtual scrolling cho columns lớn

---

## 📋 Chi Tiết Triển Khai

### Phase 1: Core Structure

#### 1.1 KanbanView Component
```
src/components/boards/views/kanban-view.tsx
```

**Props** (giống TableView):
```typescript
interface KanbanViewProps {
  board: {
    _id: string;
    properties: Property[];
  };
  tasks: TaskData[];
  view: View;
  searchQuery?: string;
  filters?: FilterConfig[];
  sorts?: SortConfig[];
  users?: UserOption[];
  onCreateTask: (title: string, properties?: Record<string, unknown>) => Promise<TaskData | null>;
  onUpdateTask: (taskId: string, updates: Partial<TaskData>) => void;
  onDeleteTask: (taskId: string) => void;
  onAddPropertyOption?: (propertyId: string, option: SelectOption) => void;
  onUpdatePropertyOption?: (propertyId: string, option: SelectOption) => void;
  onReorderTasks?: (taskId: string, newOrder: number, newGroupValue?: string) => void;
  groupByPropertyId?: string; // Required for Kanban
}
```

#### 1.2 Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Kanban Container (horizontal scroll)                            │
├────────────┬────────────┬────────────┬────────────┬────────────┤
│ Column 1   │ Column 2   │ Column 3   │ Column 4   │ + Add Col  │
│ (Option 1) │ (Option 2) │ (Option 3) │ (No Value) │            │
├────────────┼────────────┼────────────┼────────────┼────────────┤
│ Header     │ Header     │ Header     │ Header     │            │
│ - Title    │ - Title    │ - Title    │ - Title    │            │
│ - Count    │ - Count    │ - Count    │ - Count    │            │
│ - Color    │ - Color    │ - Color    │ - Color    │            │
├────────────┼────────────┼────────────┼────────────┤            │
│            │            │            │            │            │
│ [Card 1]   │ [Card 1]   │ [Card 1]   │ [Card 1]   │            │
│ [Card 2]   │ [Card 2]   │            │            │            │
│ [Card 3]   │            │            │            │            │
│            │            │            │            │            │
│ + Add Card │ + Add Card │ + Add Card │ + Add Card │            │
│            │            │            │            │            │
└────────────┴────────────┴────────────┴────────────┴────────────┘
```

### Phase 2: Sub-Components

#### 2.1 KanbanColumn
```typescript
interface KanbanColumnProps {
  id: string;
  title: string;
  color?: string;
  count: number;
  tasks: TaskData[];
  isDropTarget: boolean;
  onAddTask: () => void;
  onDropTask: (taskId: string) => void;
}
```

Features:
- Droppable zone (dnd-kit)
- Collapse/expand
- Aggregation footer (optional)
- Quick add card button

#### 2.2 KanbanCard
```typescript
interface KanbanCardProps {
  task: TaskData;
  properties: Property[];
  visiblePropertyIds: string[]; // Từ view config
  onUpdate: (updates: Partial<TaskData>) => void;
  onDelete: () => void;
  users?: UserOption[];
  compact?: boolean;
}
```

Features:
- Draggable (dnd-kit)
- Title (editable inline)
- Property cells (sử dụng lại `PropertyCell`)
- Quick actions menu (delete, copy, move)
- Cover image (nếu có attachment là image)

#### 2.3 KanbanCardModal
```typescript
interface KanbanCardModalProps {
  task: TaskData;
  board: Board;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<TaskData>) => void;
  onDelete: () => void;
  users?: UserOption[];
}
```

Features:
- Full-screen modal khi click card
- All properties editable
- Activity/comments (future)
- Attachments preview

### Phase 3: Drag & Drop

#### 3.1 DnD Context Setup
```typescript
// Sử dụng @dnd-kit như Table View
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
```

#### 3.2 Drag Types
1. **Card within column**: Reorder trong cùng column
2. **Card across columns**: Thay đổi group value + reorder
3. **Column reorder** (optional): Đổi vị trí columns

#### 3.3 API Integration
Khi drop card:
1. Call `onUpdateTask` để update property value (group field)
2. Call `POST /api/boards/[boardId]/tasks/reorder` với new order

**Cần thêm API** (hoặc extend hiện có):
```typescript
// POST /api/boards/[boardId]/tasks/[taskId]/move
{
  newGroupValue: string | null, // Giá trị mới của groupBy property
  newOrder: number,             // Vị trí mới trong column
}
```

### Phase 4: View Config

#### 4.1 Kanban-specific Config
```typescript
interface KanbanViewConfig extends ViewConfig {
  groupBy: string;           // REQUIRED: property ID để group
  cardProperties?: string[]; // Properties hiển thị trên card
  columnWidth?: number;      // Độ rộng cố định mỗi column (default 280)
  showEmptyColumns?: boolean;// Hiển thị columns không có cards
  cardSize?: 'compact' | 'default' | 'expanded';
}
```

#### 4.2 Default Card Display
- **Title**: Luôn hiển thị
- **Max 4 properties** trên card (configurable)
- Priority: status > date > person > others
- Full properties trong modal

### Phase 5: Integration với Board Page

#### 5.1 View Switching
```tsx
// src/app/dashboard/boards/[boardId]/client.tsx
{activeView?.type === ViewType.KANBAN ? (
  <KanbanView
    board={board}
    tasks={tasks}
    view={activeView}
    // ... same props as TableView
  />
) : (
  <TableView ... />
)}
```

#### 5.2 View Creation
Khi tạo Kanban view, phải chọn `groupBy` property:
- Status
- Select
- Person
- Multi-select (chọn option đầu tiên)

---

## 🔧 API Sử Dụng

### Existing APIs (đủ dùng)
| Endpoint | Method | Dùng cho |
|----------|--------|----------|
| `/api/boards/[boardId]` | GET | Lấy board info + properties |
| `/api/boards/[boardId]` | PATCH | Update board (add view, properties) |
| `/api/boards/[boardId]/tasks` | GET | Lấy tất cả tasks |
| `/api/boards/[boardId]/tasks` | POST | Tạo task mới |
| `/api/boards/[boardId]/tasks/[taskId]` | PATCH | Update task (properties, title) |
| `/api/boards/[boardId]/tasks/[taskId]` | DELETE | Xóa task |
| `/api/boards/[boardId]/tasks/reorder` | POST | Reorder tasks |
| `/api/boards/[boardId]/members` | GET | Lấy danh sách users |

### API Enhancement (optional nhưng recommend)

#### Bulk Update Tasks
```typescript
// PATCH /api/boards/[boardId]/tasks/bulk
{
  updates: [
    { taskId: "...", properties: {...}, order: 0 },
    { taskId: "...", properties: {...}, order: 1 },
  ]
}
```
→ Giảm số API calls khi drag nhiều cards

---

## 📁 File Structure

```
src/components/boards/views/
├── table-view.tsx          # Existing
├── property-cell.tsx       # Existing - REUSE
├── kanban-view.tsx         # NEW - Main component
├── kanban-column.tsx       # NEW - Column wrapper
├── kanban-card.tsx         # NEW - Card component
└── kanban-card-modal.tsx   # NEW - Full card modal
```

---

## 📱 Responsive Design

### Desktop (≥1024px)
- Horizontal scroll cho columns
- Column width: 280-320px
- Cards full width trong column

### Tablet (768px - 1023px)
- 2-3 columns visible
- Horizontal scroll
- Compact cards

### Mobile (<768px)
- **Vertical stack** columns
- Collapsible column headers
- Swipe để đổi column (hoặc tabs)
- Cards full width

---

## ⏱️ Timeline Ước Tính

| Phase | Công việc | Thời gian |
|-------|-----------|-----------|
| 1 | Core structure + basic rendering | 1-2 ngày |
| 2 | Sub-components + PropertyCell integration | 1-2 ngày |
| 3 | Drag & Drop hoàn chỉnh | 2-3 ngày |
| 4 | View config + Card modal | 1 ngày |
| 5 | Integration + Testing | 1 ngày |
| 6 | Polish + Edge cases | 1 ngày |

**Tổng: ~7-10 ngày**

---

## ✅ Checklist Triển Khai

### Phase 1: Core
- [ ] Tạo `kanban-view.tsx` với layout cơ bản
- [ ] Group tasks theo property
- [ ] Render columns với cards đơn giản

### Phase 2: Components
- [ ] Tạo `KanbanColumn` với header + card list
- [ ] Tạo `KanbanCard` tái sử dụng `PropertyCell`
- [ ] Tạo `KanbanCardModal` cho full edit

### Phase 3: DnD
- [ ] Setup DndContext cho Kanban
- [ ] Implement drag card within column
- [ ] Implement drag card across columns
- [ ] Integrate với reorder API
- [ ] Handle optimistic updates

### Phase 4: Features
- [ ] Search/Filter integration
- [ ] Sort trong từng column
- [ ] Add card quick action
- [ ] Column aggregations
- [ ] Empty column handling

### Phase 5: Polish
- [ ] Mobile responsive
- [ ] Animations
- [ ] Loading states
- [ ] Error handling
- [ ] Keyboard navigation

---

## 🎨 UI/UX Notes

### Card Design
```
┌──────────────────────────────┐
│ [Cover Image - if attachment]│
├──────────────────────────────┤
│ Task Title                   │
│                              │
│ 🟢 Status    📅 Due Date     │
│ 👤 Assignee  💰 Amount       │
│                              │
│ 📎 2  💬 5                   │
└──────────────────────────────┘
```

### Column Design
```
┌──────────────────────────────┐
│ 🔵 Column Title        (12)  │  ← Count
├──────────────────────────────┤
│ [Drag & Drop Zone]           │
│                              │
│ + Add a card                 │
└──────────────────────────────┘
```

### Drag Feedback
- Ghost card khi drag
- Column highlight khi hover
- Drop indicator line
- Smooth animation on drop

---

## 🔄 State Management

### Local State (trong component)
- Dragging state
- Expanded/collapsed columns
- Modal open/close
- Optimistic updates

### Parent State (từ Board page)
- Tasks array
- View config
- Filters/Sorts

### API Sync
- Debounced updates (300ms)
- Optimistic UI
- Error rollback
- Loading indicators

---

## 📝 Notes

1. **Không cần API mới** - tất cả functionality có thể implement với APIs hiện tại
2. **PropertyCell reusable** - đây là điểm mạnh, không cần viết lại cell editors
3. **View config stored in board** - Kanban view lưu trong `board.views[]`
4. **Mobile-first optional** - có thể implement desktop first rồi responsive sau
