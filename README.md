# K-ERP - Hệ thống Quản lý Doanh nghiệp

<p align="center">
  <strong>Hệ thống quản lý công việc linh hoạt với khả năng tùy biến cao như Notion</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-9-green" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-cyan" alt="Tailwind" />
</p>

---

## ✨ Tính năng

### 📋 Quản lý Công việc (Task Management)
- **Custom Properties**: 12 loại property (text, number, date, select, multi-select, person, status, currency, checkbox, rich-text, attachment, user)
- **Multiple Views**: Table View và Kanban View
- **Drag & Drop**: Sắp xếp tasks, columns, và properties
- **Filter & Sort**: Nhiều operators hỗ trợ lọc và sắp xếp
- **Aggregation**: Count, Sum, Average, Min, Max, Median
- **Rich Text Editor**: Lexical editor với Markdown shortcuts

### 👥 Quản lý Người dùng
- **Role-based Access Control**: Admin, Manager, Staff, User
- **User Approval System**: Auto-approve, Manual approve, Disabled
- **Admin Dashboard**: Thống kê và quản lý người dùng

### 🔐 Board Permissions
- **6 cấp độ quyền**: Owner, Admin, Editor, Viewer, Restricted Editor, Restricted Viewer
- **Scope-based permissions**: All tasks vs Assigned tasks only
- **Member Management**: Mời và quản lý thành viên board

### 🎨 UI/UX
- **Modern Design**: Tailwind CSS với design system
- **Dark/Light Mode**: Hỗ trợ theme switching
- **Responsive**: Tối ưu cho desktop và mobile
- **Toast Notifications**: Feedback cho user actions

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 4, Radix UI, Lucide Icons |
| **State** | Zustand, React Hook Form |
| **Backend** | Next.js API Routes, NextAuth 5 |
| **Database** | MongoDB, Mongoose 9 |
| **Editor** | Lexical |
| **DnD** | @dnd-kit |
| **Validation** | Zod |

---

## 🚀 Bắt đầu

### Yêu cầu

- Node.js 18+ 
- pnpm (recommended) hoặc npm/yarn
- MongoDB (local hoặc Atlas)

### Cài đặt

1. **Clone repository**
```bash
git clone https://github.com/k4ris-su/K-ERP.git
cd K-ERP
```

2. **Cài đặt dependencies**
```bash
pnpm install
```

3. **Tạo file environment**
```bash
cp .env.example .env.local
```

4. **Cấu hình environment variables**
```env
# Database
MONGODB_URI=mongodb://admin:password123@localhost:27017/k-erp?authSource=admin

# NextAuth
AUTH_SECRET=your-secret-key-here
AUTH_URL=http://localhost:3000

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. **Khởi động MongoDB** (nếu dùng Docker)
```bash
docker-compose up -d mongodb
```

6. **Seed admin user** (optional)
```bash
pnpm db:seed
```

7. **Chạy development server**
```bash
pnpm dev
```

8. **Mở trình duyệt**
```
http://localhost:3000
```

---

## 📁 Cấu trúc Project

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Auth pages
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── auth/             # Auth components
│   ├── boards/           # Board components
│   ├── editor/           # Lexical editor
│   ├── providers/        # Context providers
│   └── ui/               # UI components (shadcn)
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities
│   ├── auth.ts           # NextAuth config
│   ├── db.ts             # MongoDB connection
│   └── validations/      # Zod schemas
├── models/                # Mongoose models
├── store/                 # Zustand stores
└── types/                 # TypeScript types
```

---

## 📝 Scripts

```bash
# Development
pnpm dev          # Start dev server

# Build
pnpm build        # Build for production
pnpm start        # Start production server

# Linting
pnpm lint         # Run ESLint

# Database
pnpm db:seed      # Seed admin user
```

---

## 🔐 Default Admin Account

Sau khi chạy `pnpm db:seed`:

```
Email: admin@k-erp.local
Password: Admin@123
```

⚠️ **Quan trọng**: Đổi mật khẩu ngay sau khi đăng nhập lần đầu!

---

## 📚 Documentation

- [Task Management Plan](./docs/PLAN-TASK-MANAGEMENT.md)
- [User/Role Permission Plan](./docs/USER_ROLE_PERMISSION_PLAN.md)
- [Kanban View Plan](./docs/KANBAN-VIEW-PLAN.md)
- [Improvement Plan](./docs/IMPROVEMENT-PLAN.md)

---

## 🤝 Contributing

Xem [CONTRIBUTING.md](./CONTRIBUTING.md) để biết hướng dẫn contribute.

---

## 📄 License

MIT License - xem [LICENSE](./LICENSE) để biết thêm chi tiết.

---

## 👨‍💻 Author

**K4ris-su**

---

<p align="center">
  Made with ❤️ using Next.js
</p>
