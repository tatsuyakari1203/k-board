# 📋 Plan: Tối ưu hệ thống User/Role-Based Permission

## 📊 Phân tích hệ thống hiện tại

### Cấu trúc User hiện có

```
User Model:
├── email: string (unique)
├── name: string
├── password: string (hashed)
├── role: "admin" | "manager" | "staff" | "user"
├── image?: string
├── isActive: boolean (default: true)
├── createdAt, updatedAt
```

### Role Hierarchy hiện tại

```typescript
ROLE_HIERARCHY = {
  admin: 100,
  manager: 75,
  staff: 50,
  user: 25,
}
```

### Vấn đề hiện tại

1. ❌ User đăng ký tự động được `isActive: true` → Login ngay lập tức
2. ❌ Không có cơ chế duyệt user mới
3. ❌ Không có cài đặt hệ thống cho admin
4. ❌ Board chỉ có `ownerId` → Không có collaboration
5. ❌ Không có permission CRUD cho board/project

---

## 🎯 Mục tiêu

### Phase 1: User Management & Approval System

1. Admin có thể thiết lập chế độ đăng ký:

   - `auto_approve`: Tự động duyệt user mới
   - `manual_approve`: Duyệt thủ công (pending → approved)
   - `disabled`: Không cho phép đăng ký công khai

2. Admin có thể:
   - Xem danh sách user (all, pending, active, inactive)
   - Approve/Reject user pending
   - Tạo user thủ công
   - Chỉnh sửa role/status user
   - Deactivate/Reactivate user

### Phase 2: Project/Board Collaboration với Role-Based Permission

1. Board có thể chia sẻ với members
2. Mỗi member có permission level: `owner`, `editor`, `commenter`, `viewer`
3. Permission CRUD:
   - **Owner**: Full control (delete board, manage members)
   - **Editor**: CRUD tasks, edit properties, manage views
   - **Commenter**: View + Comment (future feature)
   - **Viewer**: Read-only

---

## 📐 Database Schema Changes

### 1. New: SystemSettings Model

```typescript
// src/models/system-settings.model.ts
interface ISystemSettings {
  _id: ObjectId;
  key: string; // unique
  value: unknown;
  updatedBy: ObjectId;
  updatedAt: Date;
}

// Initial settings:
{
  key: "user_registration_mode",
  value: "manual_approve" // "auto_approve" | "manual_approve" | "disabled"
}
```

### 2. Update: User Model

```typescript
// Thêm fields mới
interface IUserDocument {
  // ... existing fields
  status: 'pending' | 'approved' | 'rejected' // NEW
  approvedBy?: ObjectId // NEW - Admin who approved
  approvedAt?: Date // NEW
  rejectedReason?: string // NEW - Lý do từ chối
  createdBy?: ObjectId // NEW - Nếu admin tạo thủ công
}
```

### 3. New: BoardMember Model (Collaboration)

```typescript
// src/models/board-member.model.ts
interface IBoardMember {
  _id: ObjectId
  boardId: ObjectId
  userId: ObjectId
  permission: 'owner' | 'editor' | 'commenter' | 'viewer'
  invitedBy: ObjectId
  invitedAt: Date
  acceptedAt?: Date // Nếu cần invitation flow
}

// Indexes:
// - { boardId: 1, userId: 1 } unique
// - { userId: 1 }
```

### 4. Update: Board Model

```typescript
interface IBoard {
  // ... existing fields
  ownerId: ObjectId // Giữ nguyên - Owner chính
  isPublic: boolean // NEW - Có public không (future)
}
```

---

## 🔐 Permission Logic

### User Registration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Registration                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Check Settings  │
                    │ registration_mode│
                    └─────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────────┐      ┌──────────┐
   │ disabled │        │manual_approve│      │auto_approve│
   └──────────┘        └──────────────┘      └──────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   Return Error        status: "pending"     status: "approved"
   "Không cho phép     isActive: false       isActive: true
    đăng ký"           → Admin phải duyệt    → Login ngay
```

### Board Permission Check Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Check Board Access                              │
│              checkBoardPermission(userId, boardId, action)   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ 1. Is Owner?    │
                    │    board.ownerId│
                    └─────────────────┘
                         │Yes      │No
                         ▼         ▼
                    [Full Access] ┌─────────────────┐
                                  │ 2. Check        │
                                  │    BoardMember  │
                                  └─────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
               [editor]           [commenter]        [viewer]
                    │                  │                  │
                    ▼                  ▼                  ▼
              CRUD Tasks          View + Comment      View Only
              Edit Board          (future)
              Manage Views
```

### Permission Matrix

| Action              | Owner | Editor | Commenter | Viewer |
| ------------------- | ----- | ------ | --------- | ------ |
| View Board          | ✅    | ✅     | ✅        | ✅     |
| View Tasks          | ✅    | ✅     | ✅        | ✅     |
| Create Task         | ✅    | ✅     | ❌        | ❌     |
| Edit Task           | ✅    | ✅     | ❌        | ❌     |
| Delete Task         | ✅    | ✅     | ❌        | ❌     |
| Edit Board Settings | ✅    | ✅     | ❌        | ❌     |
| Manage Properties   | ✅    | ✅     | ❌        | ❌     |
| Manage Views        | ✅    | ✅     | ❌        | ❌     |
| Invite Members      | ✅    | ❌     | ❌        | ❌     |
| Remove Members      | ✅    | ❌     | ❌        | ❌     |
| Delete Board        | ✅    | ❌     | ❌        | ❌     |
| Transfer Ownership  | ✅    | ❌     | ❌        | ❌     |

---

## 📁 File Structure Changes

### New Files

```
src/
├── models/
│   ├── system-settings.model.ts    # NEW
│   └── board-member.model.ts       # NEW
│
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── users/
│   │   │   │   ├── route.ts              # GET all users, POST create user
│   │   │   │   └── [userId]/
│   │   │   │       ├── route.ts          # PATCH update, DELETE
│   │   │   │       └── approve/route.ts  # POST approve/reject
│   │   │   └── settings/
│   │   │       └── route.ts              # GET/PATCH system settings
│   │   │
│   │   └── boards/
│   │       └── [boardId]/
│   │           └── members/
│   │               ├── route.ts          # GET members, POST invite
│   │               └── [memberId]/
│   │                   └── route.ts      # PATCH permission, DELETE remove
│   │
│   └── dashboard/
│       └── admin/
│           ├── layout.tsx                # Admin layout with guard
│           ├── page.tsx                  # Admin overview
│           ├── users/
│           │   └── page.tsx              # User management
│           └── settings/
│               └── page.tsx              # System settings
│
├── components/
│   ├── admin/
│   │   ├── user-table.tsx
│   │   ├── user-form.tsx
│   │   ├── pending-users-list.tsx
│   │   └── settings-form.tsx
│   │
│   └── boards/
│       ├── member-list.tsx               # NEW
│       ├── invite-member-dialog.tsx      # NEW
│       └── permission-select.tsx         # NEW
│
├── lib/
│   ├── permissions.ts                    # NEW - Permission utilities
│   └── validations/
│       ├── admin.ts                      # NEW - Admin validation schemas
│       └── board-member.ts               # NEW
│
└── types/
    ├── admin.ts                          # NEW
    └── board-member.ts                   # NEW
```

### Modified Files

```
src/
├── models/
│   └── user.model.ts                     # Add status, approvedBy, etc.
│
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── register/route.ts         # Check registration mode
│   │   └── boards/
│   │       ├── route.ts                  # Filter by permission
│   │       └── [boardId]/
│   │           ├── route.ts              # Check permission
│   │           └── tasks/
│   │               └── route.ts          # Check permission
│   │
│   └── dashboard/
│       └── layout.tsx                    # Add admin nav link
│
├── lib/
│   └── auth.ts                           # Add status check
│
└── proxy.ts                              # Add /dashboard/admin routes
```

---

## 🔧 API Endpoints

### Admin - User Management

```
GET    /api/admin/users                    # List users (with filters)
POST   /api/admin/users                    # Create user manually
GET    /api/admin/users/:userId            # Get user details
PATCH  /api/admin/users/:userId            # Update user
DELETE /api/admin/users/:userId            # Delete user
POST   /api/admin/users/:userId/approve    # Approve/Reject user
```

### Admin - System Settings

```
GET    /api/admin/settings                 # Get all settings
PATCH  /api/admin/settings                 # Update settings
```

### Board Members (Collaboration)

```
GET    /api/boards/:boardId/members        # List members
POST   /api/boards/:boardId/members        # Invite member
PATCH  /api/boards/:boardId/members/:id    # Update permission
DELETE /api/boards/:boardId/members/:id    # Remove member
```

---

## 🎨 UI Components

### Admin Dashboard

```
/dashboard/admin
├── Overview
│   ├── Total Users
│   ├── Pending Approvals (badge)
│   ├── Active Users
│   └── Users by Role chart
│
├── /users
│   ├── Tabs: All | Pending | Active | Inactive
│   ├── Search & Filter
│   ├── User Table
│   │   ├── Name, Email, Role, Status
│   │   ├── Actions: Edit, Approve/Reject, Deactivate
│   │   └── Bulk actions
│   └── Create User button → Modal
│
└── /settings
    ├── Registration Mode
    │   ├── ○ Auto Approve
    │   ├── ○ Manual Approve (default)
    │   └── ○ Disabled
    └── Other settings (future)
```

### Board Collaboration UI

```
Board Header/Settings
├── Share button → Member Dialog
│   ├── Current Members List
│   │   ├── Avatar, Name, Permission dropdown
│   │   └── Remove button (owner only)
│   │
│   ├── Invite Section
│   │   ├── Search users
│   │   ├── Permission select
│   │   └── Invite button
│   │
│   └── Copy Link (if public, future)
```

---

## 📋 Implementation Order

### Sprint 1: User Management Foundation (3-4 days)

- [ ] 1.1 Create SystemSettings model
- [ ] 1.2 Update User model (add status fields)
- [ ] 1.3 Create migration script for existing users
- [ ] 1.4 Update register API (check mode, set status)
- [ ] 1.5 Update auth.ts (check user status on login)

### Sprint 2: Admin API (2-3 days)

- [ ] 2.1 Create admin users API (CRUD)
- [ ] 2.2 Create approve/reject API
- [ ] 2.3 Create settings API
- [ ] 2.4 Add admin route protection

### Sprint 3: Admin UI (2-3 days)

- [ ] 3.1 Create admin layout & navigation
- [ ] 3.2 Create user management page
- [ ] 3.3 Create settings page
- [ ] 3.4 Create pending users notification

### Sprint 4: Board Collaboration Foundation (2-3 days)

- [ ] 4.1 Create BoardMember model
- [ ] 4.2 Create permission utility functions
- [ ] 4.3 Update boards API (filter by access)
- [ ] 4.4 Update board/tasks API (check permissions)

### Sprint 5: Board Collaboration API (2-3 days)

- [ ] 5.1 Create members API (CRUD)
- [ ] 5.2 Add permission checks to all board routes
- [ ] 5.3 Update board listing (include shared boards)

### Sprint 6: Board Collaboration UI (2-3 days)

- [ ] 6.1 Create member list component
- [ ] 6.2 Create invite dialog
- [ ] 6.3 Create permission selector
- [ ] 6.4 Integrate into board header/settings

### Sprint 7: Testing & Polish (1-2 days)

- [ ] 7.1 Unit tests for permission logic
- [ ] 7.2 Integration tests for APIs
- [ ] 7.3 UI/UX polish
- [ ] 7.4 Documentation

---

## ⚠️ Migration Notes

### Existing Users

```javascript
// Migration script
db.users.updateMany(
  { status: { $exists: false } },
  {
    $set: {
      status: 'approved',
      approvedAt: new Date(),
    },
  }
)
```

### Existing Boards

```javascript
// All existing boards - owner is already member with "owner" permission
// Optional: Create BoardMember entries for owners
boards.forEach(board => {
  db.boardmembers.insertOne({
    boardId: board._id,
    userId: board.ownerId,
    permission: 'owner',
    invitedBy: board.ownerId,
    invitedAt: board.createdAt,
    acceptedAt: board.createdAt,
  })
})
```

---

## 🔒 Security Considerations

1. **Rate Limiting**

   - Register: 3 requests/minute
   - Admin APIs: 100 requests/minute

2. **Input Validation**

   - Zod schemas for all inputs
   - Sanitize user content

3. **Permission Checks**

   - Every API must verify permissions
   - Use middleware for common checks

4. **Audit Logging** (Future)
   - Log admin actions
   - Log permission changes

---

## 📝 Notes

### Không triển khai trong phase này:

- Invitation email notification
- Comment system
- Public boards
- Team/Organization layer
- Permission inheritance

### Future Considerations:

- Organization/Team model (nhiều boards)
- Custom roles
- Granular permissions (per-property)
- Activity feed
- Notifications system

---

## ✅ Approval Checklist

- [ ] Schema changes approved
- [ ] API design approved
- [ ] UI/UX design approved
- [ ] Security measures approved
- [ ] Migration plan approved
- [ ] Timeline approved

---

**Prepared by:** AI Assistant
**Date:** 2025-12-03
**Status:** Pending Review
