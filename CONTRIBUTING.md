# Hướng dẫn đóng góp cho K-Board

Cảm ơn bạn đã quan tâm đến việc đóng góp cho **K-Board**! Chúng tôi hoan nghênh mọi sự đóng góp từ cộng đồng.

## 📋 Mục lục

- [Code of Conduct](#code-of-conduct)
- [Bắt đầu](#bắt-đầu)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

- Tôn trọng mọi người tham gia
- Sử dụng ngôn ngữ lịch sự và chuyên nghiệp
- Chấp nhận phản hồi mang tính xây dựng
- Tập trung vào những gì tốt nhất cho cộng đồng

---

## 🚀 Bắt đầu

### 2. Cài đặt môi trường

1.  **Clone repository**:
    ```bash
    git clone https://github.com/tatsuyakari1203/k-board.git
    cd k-board
    ```

### 2. Cài đặt Dependencies

```bash
pnpm install
```

### 3. Tạo Branch

```bash
git checkout -b feature/your-feature-name
# hoặc
git checkout -b fix/your-bug-fix
```

### 4. Setup Environment

```bash
cp .env.example .env.local
# Điền các giá trị cần thiết
```

### 5. Chạy Development Server

```bash
pnpm dev
```

---

## 💻 Development Workflow

### Cấu trúc Project

```
src/
├── app/           # Next.js App Router pages & API routes
├── components/    # React components
├── hooks/         # Custom React hooks
├── lib/           # Utilities & helpers
├── models/        # Mongoose models
├── store/         # Zustand stores
└── types/         # TypeScript types
```

### Quy tắc đặt tên

| Type       | Convention                 | Example            |
| ---------- | -------------------------- | ------------------ |
| Components | PascalCase                 | `BoardHeader.tsx`  |
| Hooks      | camelCase với prefix `use` | `useBoardTasks.ts` |
| Utilities  | camelCase                  | `formatDate.ts`    |
| Types      | PascalCase                 | `BoardMember.ts`   |
| API Routes | lowercase                  | `route.ts`         |

### Component Structure

```tsx
// 1. Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Types
interface Props {
  title: string;
  onSubmit: () => void;
}

// 3. Component
export function MyComponent({ title, onSubmit }: Props) {
  // Hooks
  const [state, setState] = useState("");

  // Handlers
  const handleClick = () => {
    // ...
  };

  // Render
  return <div>{/* JSX */}</div>;
}
```

---

## 📝 Coding Standards

### TypeScript

- Luôn sử dụng TypeScript
- Định nghĩa types rõ ràng, tránh `any`
- Sử dụng `interface` cho objects, `type` cho unions

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
}

// ❌ Bad
const user: any = { ... };
```

### React

- Sử dụng functional components
- Sử dụng hooks thay vì class components
- Memoize khi cần thiết (`useMemo`, `useCallback`)

### Styling

- Sử dụng Tailwind CSS
- Sử dụng `cn()` utility cho conditional classes
- Tránh inline styles

```tsx
// ✅ Good
<div className={cn("p-4", isActive && "bg-blue-500")} />

// ❌ Bad
<div style={{ padding: "16px" }} />
```

### API Routes

- Validate input với Zod
- Handle errors gracefully
- Return consistent response format

```typescript
// Response format
{
  data?: T;
  error?: string;
  message?: string;
}
```

---

## 📦 Commit Guidelines

Sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type       | Mô tả                               |
| ---------- | ----------------------------------- |
| `feat`     | Tính năng mới                       |
| `fix`      | Sửa bug                             |
| `docs`     | Thay đổi documentation              |
| `style`    | Format code (không ảnh hưởng logic) |
| `refactor` | Refactor code                       |
| `perf`     | Cải thiện performance               |
| `test`     | Thêm/sửa tests                      |
| `chore`    | Cập nhật build, deps, etc.          |

### Examples

```bash
feat(board): add kanban view
fix(auth): handle session expiry
docs(readme): update installation guide
refactor(hooks): simplify useBoardTasks
```

---

## 🔄 Pull Request Process

### 1. Trước khi tạo PR

- [ ] Code đã được format (`pnpm lint`)
- [ ] Không có TypeScript errors (`pnpm build`)
- [ ] Đã test thủ công các changes
- [ ] Commit messages theo convention

### 2. Tạo PR

- Sử dụng template PR (nếu có)
- Mô tả rõ ràng changes
- Link đến issue liên quan (nếu có)
- Thêm screenshots cho UI changes

### 3. PR Title Format

```
<type>(<scope>): <description>
```

Example: `feat(kanban): add column aggregations`

### 4. Review Process

- Ít nhất 1 approval cần thiết
- Tất cả CI checks phải pass
- Resolve tất cả comments

---

## ❓ Câu hỏi?

Nếu có câu hỏi, hãy tạo [Issue](https://github.com/k4ris-su/K-Board/issues) với label `question`.

---

Cảm ơn bạn đã đóng góp! 🙏
