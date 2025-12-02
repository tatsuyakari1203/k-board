# 📋 Plan: Hệ thống Quản lý Công việc (Task Management)

> **Ngày tạo:** 2024-12-02
> **Trạng thái:** 🟡 Đang triển khai

---

## 🎯 Mục tiêu

Xây dựng hệ thống quản lý task linh hoạt với:

- **Custom Properties**: Người dùng tự định nghĩa các trường dữ liệu
- **Multiple Views**: Kanban, Table (như Notion)
- **Smooth Transitions**: Chuyển đổi view mượt mà

---

## 📊 Database Schema

### 1. Board (Bảng quản lý)

| Field       | Type       | Mô tả              |
| ----------- | ---------- | ------------------ |
| \_id        | ObjectId   | ID                 |
| name        | String     | Tên board          |
| description | String     | Mô tả              |
| ownerId     | ObjectId   | Người tạo          |
| properties  | Property[] | Định nghĩa các cột |
| views       | View[]     | Cấu hình views     |
| createdAt   | Date       |                    |
| updatedAt   | Date       |                    |

### 2. Property (Embedded trong Board)

| Field    | Type          | Mô tả                                                              |
| -------- | ------------- | ------------------------------------------------------------------ |
| id       | String (uuid) | ID                                                                 |
| name     | String        | Tên thuộc tính                                                     |
| type     | Enum          | text, number, date, select, multi-select, person, status, currency |
| options  | Option[]      | Cho select/status                                                  |
| order    | Number        | Thứ tự hiển thị                                                    |
| required | Boolean       | Bắt buộc                                                           |

### 3. Task (Công việc/Hồ sơ)

| Field      | Type     | Mô tả                 |
| ---------- | -------- | --------------------- |
| \_id       | ObjectId | ID                    |
| boardId    | ObjectId | Board chứa task       |
| title      | String   | Tiêu đề               |
| properties | Object   | { propertyId: value } |
| order      | Number   | Thứ tự                |
| createdBy  | ObjectId | Người tạo             |
| createdAt  | Date     |                       |
| updatedAt  | Date     |                       |

### 4. View (Embedded trong Board)

| Field                    | Type          | Mô tả                    |
| ------------------------ | ------------- | ------------------------ |
| id                       | String (uuid) | ID                       |
| name                     | String        | Tên view                 |
| type                     | Enum          | table, kanban            |
| config.groupBy           | String        | Property ID (cho Kanban) |
| config.sortBy            | Object        | Cấu hình sort            |
| config.filters           | Filter[]      | Các filter               |
| config.visibleProperties | String[]      | Properties hiển thị      |
| isDefault                | Boolean       | View mặc định            |

---

## 🗂️ Cấu trúc thư mục

```
src/
├── app/dashboard/boards/
│   ├── page.tsx                    # Danh sách boards
│   └── [boardId]/
│       ├── page.tsx                # Board detail + views
│       └── settings/page.tsx       # Cấu hình board
│
├── components/boards/
│   ├── board-header.tsx            # Header + view switcher
│   ├── board-toolbar.tsx           # Filter, sort, new property
│   │
│   ├── views/
│   │   ├── table-view.tsx          # Table view
│   │   ├── kanban-view.tsx         # Kanban view
│   │   └── view-switcher.tsx       # Toggle views
│   │
│   ├── task/
│   │   ├── task-row.tsx            # Row trong table
│   │   ├── task-card.tsx           # Card trong kanban
│   │   ├── task-modal.tsx          # Modal chi tiết
│   │   └── task-properties.tsx     # Render properties
│   │
│   └── properties/
│       ├── property-editor.tsx     # Edit giá trị
│       ├── property-config.tsx     # Config property
│       ├── inputs/                 # Input components
│       └── cells/                  # Cell display components
│
├── models/
│   ├── board.model.ts
│   └── task.model.ts
│
├── types/
│   └── board.ts
│
└── lib/validations/
    └── board.ts
```

---

## 🔄 Phases triển khai

### Phase 1: Foundation ✅

- [x] Tạo types và Zod schemas
- [x] Tạo Mongoose models (Board, Task)
- [x] API routes CRUD cho Board
- [x] API routes CRUD cho Task
- [x] Trang danh sách Boards
- [x] Lexical Editor component

### Phase 2: Table View ⬜

- [ ] Table view component
- [ ] Dynamic columns từ properties
- [ ] Inline editing cho cells
- [ ] Add/remove rows
- [ ] Add/remove columns (properties)
- [ ] Sort cơ bản
- [ ] Filter cơ bản

### Phase 3: Kanban View ⬜

- [ ] Kanban board layout
- [ ] Drag-and-drop (dnd-kit)
- [ ] Group by status property
- [ ] Task card component
- [ ] Drag between columns

### Phase 4: Polish ⬜

- [ ] View switcher với animation
- [ ] Task detail modal
- [ ] Keyboard shortcuts
- [ ] Responsive design
- [ ] Loading states

---

## 📦 Dependencies

| Package               | Mục đích           |
| --------------------- | ------------------ |
| @dnd-kit/core         | Drag and drop      |
| @dnd-kit/sortable     | Sortable lists     |
| @tanstack/react-table | Table component    |
| date-fns              | Date formatting    |
| uuid                  | Generate IDs       |
| lexical               | Rich text editor   |
| @lexical/react        | React integration  |
| @lexical/rich-text    | Rich formatting    |
| @lexical/list         | Lists support      |
| @lexical/link         | Links support      |
| @lexical/markdown     | Markdown shortcuts |

---

## 🎨 UI Components (shadcn)

- dialog
- select
- popover
- command
- badge
- table
- tabs

---

## 📋 Default Properties Template

| Property               | Type     | Options                     |
| ---------------------- | -------- | --------------------------- |
| Tên khách hàng         | text     |                             |
| Địa chỉ thửa đất       | text     |                             |
| Mục đích đo            | select   | Tách thửa, Cấp GCN, Khác    |
| Ngày nhận hồ sơ        | date     |                             |
| Ngày đo thực địa       | date     |                             |
| Kỹ thuật viên          | person   |                             |
| Trạng thái hồ sơ       | status   | Mới, Đang xử lý, Hoàn thành |
| Ngày hoàn thành bản vẽ | date     |                             |
| Ngày nộp VPĐKĐĐ        | date     |                             |
| Ngày trả kết quả       | date     |                             |
| Phí dịch vụ            | currency |                             |
| Đã thu                 | currency |                             |
| Còn lại                | currency |                             |
| Ghi chú                | text     |                             |

---

## 📝 Notes

- Table-first approach (table là view chính)
- Single user (chưa cần collaboration)
- Chưa cần audit log

---

## 📝 Lexical Editor Integration

### Mục đích

- Rich text cho các trường mô tả, ghi chú
- Markdown shortcuts (headings, lists, bold, italic)
- Serialize thành JSON lưu MongoDB

### Packages

| Package            | Mục đích                      |
| ------------------ | ----------------------------- |
| lexical            | Core editor                   |
| @lexical/react     | React components              |
| @lexical/rich-text | Rich text formatting          |
| @lexical/list      | Lists (ordered, unordered)    |
| @lexical/link      | Links support                 |
| @lexical/markdown  | Markdown shortcuts            |
| @lexical/code      | Code blocks (optional)        |
| @lexical/selection | Selection utilities           |
| @lexical/utils     | Utilities                     |
| @lexical/history   | Undo/redo (included in react) |

### Cấu trúc files

```
src/components/editor/
├── lexical-editor.tsx          # Main editor wrapper
├── plugins/
│   ├── toolbar-plugin.tsx      # Formatting toolbar
│   └── on-change-plugin.tsx    # Sync state
├── nodes/                      # Custom nodes (if needed)
├── theme.ts                    # Editor theme matching Notion style
└── index.ts                    # Exports
```

### Usage in Task

```tsx
// Trong task-modal hoặc property editor
<LexicalEditor
  value={jsonContent}
  onChange={json => updateProperty('ghiChu', json)}
  placeholder="Nhập ghi chú..."
/>
```

### Serialize/Deserialize

```ts
// Save to MongoDB
const json = editorState.toJSON()
await Task.update({ properties: { ghiChu: json } })

// Load from MongoDB
const initialConfig = {
  editorState: savedJson ? JSON.stringify(savedJson) : undefined,
}
```

---

## 🔗 Related Files

- Models: `src/models/board.model.ts`, `src/models/task.model.ts`
- Types: `src/types/board.ts`
- Pages: `src/app/dashboard/boards/`
