# K-Board - Project & Task Management System

<p align="center">
  <strong>Flexible task management system with high customizability inspired by Notion</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-9-green" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-cyan" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License" />
</p>

---

## ✨ Features

### 📋 Task Management

- **Custom Properties**: 12 fully customizable property types:
  - Basic: Text, Number, Select, Multi-select, Date, Checkbox
  - Advanced: Person (Assignment), Status, Currency, Rich Text, Attachment, User

## Features

- **Dynamic Kanban Board**: Drag and drop tasks, customizable columns.
- **Role-Based Access Control (RBAC)**: Flexible permission system (Owner, Admin, Editor, Viewer).
- **Internationalization**: Support for multiple languages (English/Vietnamese).
- **Docker Ready**: Easy deployment with Docker Compose.
- **Table View**: Spreadsheet-like editing with bulk actions
- **Kanban View**: Drag-and-drop workflow visualization
- **Drag & Drop**: Native drag-and-drop support for tasks, columns, files, and ordering
- **Advanced Filtering**: Complex boolean logic (AND/OR) filtering
- **Aggregation**: Real-time column statistics (Sum, Average, Min, Max, Count)
- **Rich Text Editor**: Powerful Notion-style editor with slash commands and markdown support

### 👥 User & Organization

- **Role-Based Access (RBAC)**: Fine-grained permissions (Admin, Manager, Staff, User)
- **Board Permissions**:
  - **Owner**: Full control
  - **Admin**: Configure board settings
  - **Editor**: Create and edit content
  - **Viewer**: Read-only access
  - **Restricted**: Limited visibility based on assignment
- **User Approval Flow**: Security workflow for approving new user registrations
- **Member Management**: Invite system with email notifications

### 🎨 Modern Experience

- **Design System**: Built on top of Tailwind CSS 4 and Radix UI primitives
- **Theming**: First-class Dark/Light mode support
- **Responsive**: Fully optimized mobile layout
- **Interactive**: Real-time feedback with toast notifications and optimistic UI updates

---

## 🛠️ Tech Stack

| Layer          | Technologies                                    |
| -------------- | ----------------------------------------------- |
| **Frontend**   | Next.js 16 (App Router), React 19, TypeScript 5 |
| **Styling**    | Tailwind CSS 4, Radix UI, Lucide Icons          |
| **State**      | Zustand, React Query (TanStack Query)           |
| **Backend**    | Next.js API Routes, NextAuth 5 (Beta)           |
| **Database**   | MongoDB, Mongoose 9                             |
| **Animation**  | Framer Motion 12, GSAP                          |
| **Editor**     | Lexical (Meta)                                  |
| **Testing**    | Vitest, React Testing Library                   |
| **Validation** | Zod                                             |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17 or later
- pnpm (recommended) or npm/yarn
- MongoDB instance (Local or Atlas)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/tatsuyakari1203/k-board.git
cd k-board
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
```

Update `.env.local` with your credentials:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/k-board

# Auth
AUTH_SECRET="your-super-secret-key-at-least-32-chars"
AUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Seed the database** (Creates initial Admin account)

```bash
pnpm db:seed
```

5. **Start the development server**

```bash
pnpm dev
```

Visit `http://localhost:3000` to see the app.

---

## 🐳 Deployment (Docker)

### One-Line Install (Recommended)

Quickly deploy K-Board on any Linux server with Docker installed:

```bash
curl -sSL https://raw.githubusercontent.com/tatsuyakari1203/k-board/main/install.sh | bash
```

### Manual Docker Run

```bash
# Pull image
docker pull tatsuyakari/k-board:latest

# Run container
docker run -d -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/k-board \
  -e AUTH_SECRET=your_secure_secret \
  tatsuyakari/k-board:latest
```

---

## 🔐 Default Admin Credentials

The seed script creates a default administrator account:

- **Email**: `admin@k-board.local`
- **Password**: `Admin@123`

> **Note**: Please change this password immediately after logging in via the User Profile settings.

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js 16 App Directory
│   ├── [locale]/          # Internationalized routes
│   └── api/               # Backend API Endpoints
├── components/            # React 19 Components
│   ├── boards/            # Kanban & Table components
│   ├── editor/            # Lexical editor implementation
│   └── ui/                # Shadcn UI primitives
├── lib/                   # Core business logic
│   ├── auth.ts            # Authentication config
│   └── permissions.ts     # RBAC implementation
├── models/                # Mongoose 9 Schemas
├── store/                 # Global state (Zustand)
└── types/                 # TypeScript interfaces
```

---

## 📚 Documentation Plan

We maintain detailed documentation for core features in the `docs/` directory:

- [Feature: Task Management System](./docs/PLAN-TASK-MANAGEMENT.md)
- [Feature: Roles & Permissions](./docs/USER_ROLE_PERMISSION_PLAN.md)
- [Feature: Kanban Visualization](./docs/KANBAN-VIEW-PLAN.md)
- [Improvement Roadmap](./docs/IMPROVEMENT-PLAN.md)

---

## 🤝 Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**K4ris-su**

---

<p align="center">
  <sub>Built with ❤️ by the Open Source Community</sub>
</p>
