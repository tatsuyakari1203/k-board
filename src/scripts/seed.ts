import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import Board from "@/models/board.model";
import Task from "@/models/task.model";
import BoardMember from "@/models/board-member.model";
import Role from "@/models/role.model";
import { SettingsService } from "@/services/settings.service";
import { SETTING_KEYS, REGISTRATION_MODE } from "@/types/system-settings";
import { USER_ROLES, USER_STATUS } from "@/types/user";
import { PropertyType } from "@/types/board";
import {
  BOARD_ROLE_PERMISSIONS,
  BOARD_ROLE_LABELS,
  type BoardPermissions,
} from "@/types/board-member";

// --- DATA DEFINITIONS ---

const TEST_USERS = [
  {
    name: "Sarah Manager",
    email: "manager@k-board.com",
    role: "manager",
    department: "Engineering",
    position: "VP of Engineering",
  },
  {
    name: "John Staff",
    email: "staff@k-board.com",
    role: "staff",
    department: "Product",
    position: "Product Designer",
  },
  {
    name: "Alex User",
    email: "user@k-board.com",
    role: "user",
    department: "Marketing",
    position: "Intern",
  },
];

import { addDays, subDays, format } from "date-fns";

const today = new Date();
const formatDate = (date: Date) => format(date, "yyyy-MM-dd");

// Generic Project Management Tasks
const PROJECT_TASKS = [
  {
    title: "Design System V2.0",
    status: "In Progress",
    priority: "High",
    department: "Design",
    dueDate: formatDate(addDays(today, 5)),
    startDate: formatDate(subDays(today, 2)),
    assigneeEmail: "staff@k-board.com",
    notes: "Focus on dark mode consistency",
  },
  {
    title: "Q1 Marketing Campaign",
    status: "Planning",
    priority: "Medium",
    department: "Marketing",
    dueDate: formatDate(addDays(today, 20)),
    startDate: formatDate(today),
    assigneeEmail: "user@k-board.com",
    notes: "Coordinate with social media team",
  },
  {
    title: "API Performance Optimization",
    status: "Done",
    priority: "Critical",
    department: "Engineering",
    dueDate: formatDate(subDays(today, 1)),
    startDate: formatDate(subDays(today, 10)),
    assigneeEmail: "manager@k-board.com",
    notes: "Reduced latency by 40%",
  },
  {
    title: "User Research Interviews",
    status: "In Progress",
    priority: "High",
    department: "Product",
    dueDate: formatDate(addDays(today, 3)),
    startDate: formatDate(subDays(today, 1)),
    assigneeEmail: "staff@k-board.com",
    notes: "Interview 5 enterprise clients",
  },
  {
    title: "Mobile App Beta Testing",
    status: "In Progress",
    priority: "Critical",
    department: "QA",
    dueDate: formatDate(addDays(today, 10)),
    startDate: formatDate(subDays(today, 5)),
    assigneeEmail: "manager@k-board.com",
    notes: "Focus on iOS scroll issues",
  },
  {
    title: "Update Documentation",
    status: "Todo",
    priority: "Low",
    department: "Engineering",
    dueDate: formatDate(addDays(today, 30)),
    startDate: formatDate(addDays(today, 5)),
    assigneeEmail: "staff@k-board.com",
    notes: "API docs need refresh",
  },
  {
    title: "Quarterly Financial Report",
    status: "Done",
    priority: "High",
    department: "Finance",
    dueDate: formatDate(subDays(today, 5)),
    startDate: formatDate(subDays(today, 15)),
    assigneeEmail: "manager@k-board.com",
    notes: "Submitted to board",
  },
  {
    title: "Security Audit",
    status: "In Progress",
    priority: "Critical",
    department: "Security",
    dueDate: formatDate(addDays(today, 2)),
    startDate: formatDate(subDays(today, 3)),
    assigneeEmail: "manager@k-board.com",
    notes: "Pending penetration test results",
  },
];

function getPermissionsCodes(permissions: BoardPermissions): string[] {
  const codes: string[] = [];
  if (permissions.canView) codes.push("board.view");
  if (permissions.viewScope === "assigned") codes.push("view.scope.assigned");
  if (permissions.canCreateTasks) codes.push("task.create");
  if (permissions.canEditTasks) codes.push("task.edit");
  if (permissions.editScope === "assigned") codes.push("edit.scope.assigned");
  if (permissions.canDeleteTasks) codes.push("task.delete");
  if (permissions.canEditBoard) codes.push("board.edit");
  if (permissions.canManageMembers) codes.push("members.manage");
  if (permissions.canDeleteBoard) codes.push("board.delete");
  return codes;
}

async function seed() {
  try {
    console.log("🌱 Starting seed...");
    await connectDB();

    // 0. SYSTEM ROLES
    console.log("Creating/Updating System Roles...");
    const roleSlugs = Object.keys(BOARD_ROLE_PERMISSIONS);

    for (const slug of roleSlugs) {
      const permissions = BOARD_ROLE_PERMISSIONS[slug];
      const codes = getPermissionsCodes(permissions);
      const name = BOARD_ROLE_LABELS[slug as keyof typeof BOARD_ROLE_LABELS] || slug;

      await Role.findOneAndUpdate(
        { slug, boardId: null, isSystem: true }, // Find system role
        {
          name,
          slug,
          description: `System role: ${name}`,
          isSystem: true,
          boardId: null,
          permissions: codes,
        },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Synced ${roleSlugs.length} system roles`);

    // 1. ADMIN USER
    let admin = await User.findOne({ role: USER_ROLES.ADMIN });

    if (admin) {
      console.log(`✅ Using existing admin: ${admin.email}`);
      // Ensure admin is active/approved
      if (admin.status !== USER_STATUS.APPROVED || !admin.isActive) {
        admin.status = USER_STATUS.APPROVED;
        admin.isActive = true;
        await admin.save();
        console.log("   -> Activated existing admin");
      }
    } else {
      console.log("Creating new admin...");
      admin = await User.create({
        email: "admin@k-board.com",
        name: "Administrator",
        password: "admin123456", // Will be hashed by pre-save hook
        role: USER_ROLES.ADMIN,
        status: USER_STATUS.APPROVED,
        isActive: true,
        approvedAt: new Date(),
      });
      console.log("✅ Created admin: admin@k-board.com / admin123456");
    }

    if (!admin) throw new Error("Failed to resolve admin user");

    // 2. OTHER USERS
    for (const userData of TEST_USERS) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        await User.create({
          ...userData,
          password: "123456",
          status: USER_STATUS.APPROVED,
          isActive: true,
          approvedAt: new Date(),
        });
        console.log(`✅ Created user: ${userData.email}`);
      } else {
        console.log(`   User exists: ${userData.email}`);
        // Optionally update name/dept if needed
        existing.name = userData.name;
        existing.department = userData.department;
        existing.position = userData.position;
        await existing.save();
      }
    }

    // Refresh user map for assignments
    const allUsers = await User.find({});
    const getUser = (email: string) => allUsers.find((u) => u.email === email);

    // 3. SYSTEM SETTINGS
    const regMode = await SettingsService.getSetting(SETTING_KEYS.USER_REGISTRATION_MODE);
    if (!regMode) {
      await SettingsService.setSetting(
        SETTING_KEYS.USER_REGISTRATION_MODE,
        REGISTRATION_MODE.MANUAL_APPROVE
      );
      console.log("✅ Set default registration mode: MANUAL_APPROVE");
    }

    // 4. BOARDS
    // Main Product Board
    const mainBoardName = "Product Roadmap 2024";
    // Check if old VN board exists and delete it to avoid clutter
    await Board.deleteOne({ name: "Hồ sơ đo đạc 2024" });

    let mainBoard = await Board.findOne({ name: mainBoardName });

    if (mainBoard) {
      console.log(`   Board exists: ${mainBoardName} -> Recreating to update data...`);
      await Task.deleteMany({ boardId: mainBoard._id });
      await BoardMember.deleteMany({ boardId: mainBoard._id });
      await Board.deleteOne({ _id: mainBoard._id });
    }

    console.log(`Creating board: ${mainBoardName}...`);

    const properties = [
      {
        id: uuidv4(),
        name: "Status",
        type: PropertyType.STATUS,
        order: 0,
        width: 150,
        options: [
          { id: uuidv4(), label: "Todo", color: "bg-gray-100 text-gray-800" },
          { id: uuidv4(), label: "Planning", color: "bg-purple-100 text-purple-800" },
          { id: uuidv4(), label: "In Progress", color: "bg-blue-100 text-blue-800" },
          { id: uuidv4(), label: "Done", color: "bg-green-100 text-green-800" },
        ],
      },
      {
        id: uuidv4(),
        name: "Priority",
        type: PropertyType.SELECT,
        order: 1,
        width: 140,
        options: [
          { id: uuidv4(), label: "Low", color: "bg-green-50 text-green-700" },
          { id: uuidv4(), label: "Medium", color: "bg-yellow-50 text-yellow-700" },
          { id: uuidv4(), label: "High", color: "bg-orange-50 text-orange-700" },
          { id: uuidv4(), label: "Critical", color: "bg-red-50 text-red-700" },
        ],
      },
      { id: uuidv4(), name: "Department", type: PropertyType.TEXT, order: 2, width: 150 },
      { id: uuidv4(), name: "Due Date", type: PropertyType.DATE, order: 3, width: 130 },
      { id: uuidv4(), name: "Start Date", type: PropertyType.DATE, order: 4, width: 130 },
      { id: uuidv4(), name: "Assignee", type: PropertyType.USER, order: 5, width: 150 },
      { id: uuidv4(), name: "Notes", type: PropertyType.TEXT, order: 6, width: 250 },
    ];

    mainBoard = await Board.create({
      name: mainBoardName,
      description: "Strategic project roadmap for 2024",
      ownerId: admin._id,
      visibility: "workspace",
      properties,
      views: [
        {
          id: uuidv4(),
          name: "All Tasks",
          type: "table",
          config: { visibleProperties: properties.map((p) => p.id) },
          isDefault: true,
        },
        {
          id: uuidv4(),
          name: "Kanban Board",
          type: "kanban",
          config: {
            visibleProperties: properties.map((p) => p.id),
            groupBy: properties.find((p) => p.name === "Status")?.id,
          },
          isDefault: false,
        },
      ],
    });
    console.log(`✅ Created board: ${mainBoardName}`);

    // Add Members
    for (const u of TEST_USERS) {
      const userObj = getUser(u.email);
      if (userObj) {
        await BoardMember.create({
          boardId: mainBoard._id,
          userId: userObj._id,
          role: "editor",
          addedBy: admin._id,
        });
      }
    }

    // Create Tasks
    const propMap = {
      status: properties.find((p) => p.name === "Status"),
      priority: properties.find((p) => p.name === "Priority"),
      department: properties.find((p) => p.name === "Department"),
      dueDate: properties.find((p) => p.name === "Due Date"),
      startDate: properties.find((p) => p.name === "Start Date"),
      assignee: properties.find((p) => p.name === "Assignee"),
      notes: properties.find((p) => p.name === "Notes"),
    };

    for (const [index, taskData] of PROJECT_TASKS.entries()) {
      const statusOpt = propMap.status?.options?.find((o) => o.label === taskData.status)?.id;
      const priorityOpt = propMap.priority?.options?.find((o) => o.label === taskData.priority)?.id;
      const assignee = getUser(taskData.assigneeEmail)?._id?.toString();

      await Task.create({
        boardId: mainBoard._id,
        title: taskData.title,
        order: index,
        createdBy: admin._id,
        properties: {
          [propMap.status!.id]: statusOpt,
          [propMap.priority!.id]: priorityOpt,
          [propMap.department!.id]: taskData.department,
          [propMap.dueDate!.id]: taskData.dueDate,
          [propMap.startDate!.id]: taskData.startDate,
          [propMap.assignee!.id]: assignee ? [assignee] : [],
          [propMap.notes!.id]: taskData.notes,
        },
      });
    }
    console.log(`✅ Created ${PROJECT_TASKS.length} tasks for Product Board`);

    // 5. SIMPLE BOARD (Internal Work)
    const simpleBoardName = "Team Internal";
    // Clean old name
    await Board.deleteOne({ name: "Công việc nội bộ" });

    let existingSimple = await Board.findOne({ name: simpleBoardName });

    if (existingSimple) {
      console.log(`   Board exists: ${simpleBoardName} -> Recreating...`);
      await Task.deleteMany({ boardId: existingSimple._id });
      await BoardMember.deleteMany({ boardId: existingSimple._id });
      await Board.deleteOne({ _id: existingSimple._id });
      existingSimple = null;
    }

    if (!existingSimple) {
      const props = [
        {
          id: uuidv4(),
          name: "Status",
          type: PropertyType.STATUS,
          order: 0,
          width: 150,
          options: [
            { id: uuidv4(), label: "Todo", color: "bg-gray-100" },
            { id: uuidv4(), label: "Done", color: "bg-green-100" },
          ],
        },
        { id: uuidv4(), name: "Assignee", type: PropertyType.USER, order: 1, width: 150 },
      ];

      const simpleBoard = await Board.create({
        name: simpleBoardName,
        ownerId: admin._id,
        visibility: "workspace",
        properties: props,
        views: [
          {
            id: uuidv4(),
            name: "Main View",
            type: "table",
            config: { visibleProperties: props.map((p) => p.id) },
            isDefault: true,
          },
        ],
      });

      for (const u of TEST_USERS) {
        if (u.role === "user") continue;
        const userObj = getUser(u.email);
        if (userObj) {
          await BoardMember.create({
            boardId: simpleBoard._id,
            userId: userObj._id,
            role: "editor",
            addedBy: admin._id,
          });
        }
      }
      await BoardMember.create({
        boardId: simpleBoard._id,
        userId: admin._id,
        role: "owner",
        addedBy: admin._id,
      });

      await Task.create({
        boardId: simpleBoard._id,
        title: "Weekly Sync Meeting",
        order: 0,
        createdBy: admin._id,
        properties: {
          [props[0].id]: props[0].options![0].id,
          [props[1].id]: [admin._id.toString()],
        },
      });
      console.log(`✅ Created board: ${simpleBoardName}`);
    }

    // 6. PRIVATE BOARD
    // Clean old
    await Board.deleteOne({ name: "Dự án Mật (Private)" });

    const privateBoardName = "Exec Strategy (Private)";
    const existingPrivate = await Board.findOne({ name: privateBoardName });
    if (!existingPrivate) {
      const manager = getUser("manager@k-board.com");
      const staff = getUser("staff@k-board.com");

      if (manager && staff) {
        const props = [{ id: uuidv4(), name: "Status", type: PropertyType.TEXT, order: 0 }];

        const privateBoard = await Board.create({
          name: privateBoardName,
          ownerId: manager._id,
          visibility: "private",
          properties: props,
          views: [
            {
              id: uuidv4(),
              name: "Main",
              type: "table",
              config: { visibleProperties: [props[0].id] },
              isDefault: true,
            },
          ],
        });

        await BoardMember.create({
          boardId: privateBoard._id,
          userId: manager._id,
          role: "owner",
          addedBy: admin._id,
        });
        await BoardMember.create({
          boardId: privateBoard._id,
          userId: staff._id,
          role: "viewer",
          addedBy: manager._id,
        });
        await BoardMember.create({
          boardId: privateBoard._id,
          userId: admin._id,
          role: "owner",
          addedBy: admin._id,
        });

        console.log(`✅ Created board: ${privateBoardName}`);
      }
    }

    console.log("🎉 Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
