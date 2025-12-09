import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import Board from "@/models/board.model";
import Task from "@/models/task.model";
import BoardMember from "@/models/board-member.model";
import {
  getSetting,
  setSetting,
  SETTING_KEYS,
  REGISTRATION_MODE,
} from "@/models/system-settings.model";
import { USER_ROLES, USER_STATUS } from "@/types/user";
import { PropertyType } from "@/types/board";

// --- DATA DEFINITIONS ---

const TEST_USERS = [
  {
    name: "Trần Thị Hương",
    email: "manager@k-erp.com",
    role: "manager",
    department: "Phòng Kỹ thuật",
    position: "Trưởng phòng",
  },
  {
    name: "Phạm Thị Lan",
    email: "staff@k-erp.com",
    role: "staff",
    department: "Phòng Kỹ thuật",
    position: "Kỹ sư đo đạc",
  },
  {
    name: "Nguyễn Văn User",
    email: "user@k-erp.com",
    role: "user",
    department: "Phòng Kinh doanh",
    position: "Thực tập sinh",
  },
];

import { addDays, subDays, format } from "date-fns";

const today = new Date();
const formatDate = (date: Date) => format(date, "yyyy-MM-dd");

const SURVEY_TASKS = [
  {
    title: "Đo đạc lô đất 123 Nguyễn Trãi",
    status: "Đã hoàn thành",
    loaiHoSo: "Đo đạc địa chính",
    diaChi: "123 Nguyễn Trãi, Q.1, TP.HCM",
    dienTich: 250.5,
    nguoiYeuCau: "Nguyễn Văn A",
    soDienThoai: "0901234567",
    ngayNhan: formatDate(subDays(today, 10)),
    ngayHenTra: formatDate(subDays(today, 3)), // Overdue if not completed (but status is completed)
    assigneeEmail: "staff@k-erp.com",
    ghiChu: "Khách hàng yêu cầu đo gấp",
  },
  {
    title: "Trích đo thửa đất 456 Lê Lợi",
    status: "Đang xử lý",
    loaiHoSo: "Trích đo địa chính",
    diaChi: "456 Lê Lợi, Q.3, TP.HCM",
    dienTich: 180.2,
    nguoiYeuCau: "Trần Thị B",
    soDienThoai: "0912345678",
    ngayNhan: formatDate(subDays(today, 5)),
    ngayHenTra: formatDate(addDays(today, 2)), // Due heavily soon
    assigneeEmail: "manager@k-erp.com",
    ghiChu: "",
  },
  {
    title: "Đo vẽ bản đồ khu công nghiệp ABC",
    status: "Chờ xử lý",
    loaiHoSo: "Đo vẽ bản đồ",
    diaChi: "KCN ABC, Bình Dương",
    dienTich: 50000,
    nguoiYeuCau: "Công ty XYZ",
    soDienThoai: "0283456789",
    ngayNhan: formatDate(subDays(today, 2)),
    ngayHenTra: formatDate(addDays(today, 30)), // Plenty of time
    assigneeEmail: "staff@k-erp.com",
    ghiChu: "Dự án lớn, cần phối hợp nhiều người",
  },
];

async function seed() {
  try {
    console.log("🌱 Starting seed...");
    await connectDB();

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
        email: "admin@k-erp.com",
        name: "Administrator",
        password: "admin123456", // Will be hashed by pre-save hook
        role: USER_ROLES.ADMIN,
        status: USER_STATUS.APPROVED,
        isActive: true,
        approvedAt: new Date(),
      });
      console.log("✅ Created admin: admin@k-erp.com / admin123456");
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
      }
    }

    // Refresh user map for assignments
    const allUsers = await User.find({});
    const getUser = (email: string) => allUsers.find((u) => u.email === email);

    // 3. SYSTEM SETTINGS
    const existingMode = await getSetting(SETTING_KEYS.USER_REGISTRATION_MODE);
    if (!existingMode) {
      await setSetting(SETTING_KEYS.USER_REGISTRATION_MODE, REGISTRATION_MODE.MANUAL_APPROVE);
      console.log("✅ Set default registration mode: MANUAL_APPROVE");
    }

    // 4. BOARDS
    // Survey Board
    const surveyBoardName = "Hồ sơ đo đạc 2024";
    let surveyBoard = await Board.findOne({ name: surveyBoardName });

    if (surveyBoard) {
      console.log(`   Board exists: ${surveyBoardName} -> Recreating to update data...`);
      await Task.deleteMany({ boardId: surveyBoard._id });
      await BoardMember.deleteMany({ boardId: surveyBoard._id });
      await Board.deleteOne({ _id: surveyBoard._id });
    }

    console.log(`Creating board: ${surveyBoardName}...`);

    // Define properties manually or import from a template source if available
    // For now, replicating the "Survey" template structure
    const properties = [
      {
        id: uuidv4(),
        name: "Trạng thái",
        type: PropertyType.STATUS,
        order: 0,
        width: 150,
        options: [
          { id: uuidv4(), label: "Chờ xử lý", color: "bg-gray-100 text-gray-800" },
          { id: uuidv4(), label: "Đang xử lý", color: "bg-blue-100 text-blue-800" },
          { id: uuidv4(), label: "Đã hoàn thành", color: "bg-green-100 text-green-800" },
        ],
      },
      {
        id: uuidv4(),
        name: "Loại hồ sơ",
        type: PropertyType.SELECT,
        order: 1,
        width: 180,
        options: [
          { id: uuidv4(), label: "Đo đạc địa chính", color: "bg-blue-50 text-blue-700" },
          { id: uuidv4(), label: "Trích đo địa chính", color: "bg-indigo-50 text-indigo-700" },
          { id: uuidv4(), label: "Đo vẽ bản đồ", color: "bg-purple-50 text-purple-700" },
        ],
      },
      { id: uuidv4(), name: "Địa chỉ", type: PropertyType.TEXT, order: 2, width: 250 },
      { id: uuidv4(), name: "Diện tích (m²)", type: PropertyType.NUMBER, order: 3, width: 120 },
      { id: uuidv4(), name: "Người yêu cầu", type: PropertyType.TEXT, order: 4, width: 150 },
      { id: uuidv4(), name: "Số điện thoại", type: PropertyType.TEXT, order: 5, width: 120 },
      { id: uuidv4(), name: "Ngày nhận", type: PropertyType.DATE, order: 6, width: 130 },
      { id: uuidv4(), name: "Ngày hẹn trả", type: PropertyType.DATE, order: 7, width: 130 },
      { id: uuidv4(), name: "Người phụ trách", type: PropertyType.USER, order: 8, width: 150 },
      { id: uuidv4(), name: "Ghi chú", type: PropertyType.TEXT, order: 9, width: 200 }, // Using Text for simplicity in seed
    ];

    surveyBoard = await Board.create({
      name: surveyBoardName,
      description: "Quản lý hồ sơ đo đạc (Seed Data)",
      ownerId: admin._id,
      visibility: "workspace",
      properties,
      views: [
        {
          id: uuidv4(),
          name: "Tất cả hồ sơ",
          type: "table",
          config: { visibleProperties: properties.map((p) => p.id) },
          isDefault: true,
        },
      ],
    });
    console.log(`✅ Created board: ${surveyBoardName}`);

    // Add Members
    for (const u of TEST_USERS) {
      const userObj = getUser(u.email);
      if (userObj) {
        await BoardMember.create({
          boardId: surveyBoard._id,
          userId: userObj._id,
          role: "editor", // Simplified
          addedBy: admin._id,
        });
      }
    }

    // Create Tasks
    const propMap = {
      status: properties.find((p) => p.name === "Trạng thái"),
      loaiHoSo: properties.find((p) => p.name === "Loại hồ sơ"),
      diaChi: properties.find((p) => p.name === "Địa chỉ"),
      dienTich: properties.find((p) => p.name === "Diện tích (m²)"),
      nguoiYeuCau: properties.find((p) => p.name === "Người yêu cầu"),
      sdt: properties.find((p) => p.name === "Số điện thoại"),
      ngayNhan: properties.find((p) => p.name === "Ngày nhận"),
      ngayHenTra: properties.find((p) => p.name === "Ngày hẹn trả"),
      phuTrach: properties.find((p) => p.name === "Người phụ trách"),
      ghiChu: properties.find((p) => p.name === "Ghi chú"),
    };

    for (const [index, taskData] of SURVEY_TASKS.entries()) {
      const statusOpt = propMap.status?.options?.find((o) => o.label === taskData.status)?.id;
      const loaiOpt = propMap.loaiHoSo?.options?.find((o) => o.label === taskData.loaiHoSo)?.id;
      const assignee = getUser(taskData.assigneeEmail)?._id?.toString();

      await Task.create({
        boardId: surveyBoard._id,
        title: taskData.title,
        order: index,
        createdBy: admin._id,
        properties: {
          [propMap.status!.id]: statusOpt,
          [propMap.loaiHoSo!.id]: loaiOpt,
          [propMap.diaChi!.id]: taskData.diaChi,
          [propMap.dienTich!.id]: taskData.dienTich,
          [propMap.nguoiYeuCau!.id]: taskData.nguoiYeuCau,
          [propMap.sdt!.id]: taskData.soDienThoai,
          [propMap.ngayNhan!.id]: taskData.ngayNhan, // ISO string needed? Date cell expects ISO usually
          [propMap.ngayHenTra!.id]: taskData.ngayHenTra,
          [propMap.phuTrach!.id]: assignee ? [assignee] : [], // User cell usually expects array of IDs
          [propMap.ghiChu!.id]: taskData.ghiChu,
        },
      });
    }
    console.log(`✅ Created ${SURVEY_TASKS.length} tasks for Survey Board`);

    // 5. SIMPLE BOARD (Internal Work)
    const simpleBoardName = "Công việc nội bộ";
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
          name: "Trạng thái",
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
        visibility: "workspace", // Visible to all workspace members
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

      // Members: Everyone is an editor here (Simplistic workspace board)
      for (const u of TEST_USERS) {
        // Skip 'user' to test workspace visibility (Viewer) fallback
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
        title: "Họp giao ban tuần",
        order: 0,
        createdBy: admin._id,
        properties: {
          [props[0].id]: props[0].options![0].id,
          [props[1].id]: [admin._id.toString()],
        },
      });
      console.log(`✅ Created board: ${simpleBoardName}`);
    }

    // 6. PRIVATE BOARD (Restricted)
    // - Manager: Owner
    // - Staff: Viewer
    // - User: No Access
    const privateBoardName = "Dự án Mật (Private)";
    const existingPrivate = await Board.findOne({ name: privateBoardName });
    if (!existingPrivate) {
      const manager = getUser("manager@k-erp.com");
      const staff = getUser("staff@k-erp.com");

      if (manager && staff) {
        const props = [{ id: uuidv4(), name: "Status", type: PropertyType.TEXT, order: 0 }];

        const privateBoard = await Board.create({
          name: privateBoardName,
          ownerId: manager._id, // Manager owns this
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

        // Manager = Owner
        await BoardMember.create({
          boardId: privateBoard._id,
          userId: manager._id,
          role: "owner",
          addedBy: admin._id,
        });
        // Staff = Viewer
        await BoardMember.create({
          boardId: privateBoard._id,
          userId: staff._id,
          role: "viewer",
          addedBy: manager._id,
        });

        // Admin gets added as owner too usually, or remains super-admin. Let's add admin as editor for visibility.
        await BoardMember.create({
          boardId: privateBoard._id,
          userId: admin._id,
          role: "owner",
          addedBy: admin._id,
        });

        console.log(
          `✅ Created board: ${privateBoardName} (Manager=Owner, Staff=Viewer, User=NoAccess)`
        );
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
