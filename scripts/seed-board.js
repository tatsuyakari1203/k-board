/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config({ path: ".env.local" });

// Sample survey data for a land surveying company
const SAMPLE_TASKS = [
  {
    title: "Đo đạc lô đất 123 Nguyễn Trãi",
    status: "Đã hoàn thành",
    loaiHoSo: "Đo đạc địa chính",
    diaChi: "123 Nguyễn Trãi, Q.1, TP.HCM",
    dienTich: 250.5,
    nguoiYeuCau: "Nguyễn Văn A",
    soDienThoai: "0901234567",
    ngayNhan: new Date("2024-11-15"),
    ngayHenTra: new Date("2024-11-22"),
    assignee: "lan.pham@k-erp.com", // Kỹ sư đo đạc
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
    ngayNhan: new Date("2024-11-20"),
    ngayHenTra: new Date("2024-11-27"),
    assignee: "nam.hoang@k-erp.com", // Kỹ sư trắc địa
    ghiChu: "",
  },
  {
    title: "Đo vẽ bản đồ khu công nghiệp ABC",
    status: "Đang xử lý",
    loaiHoSo: "Đo vẽ bản đồ",
    diaChi: "KCN ABC, Bình Dương",
    dienTich: 50000,
    nguoiYeuCau: "Công ty XYZ",
    soDienThoai: "0283456789",
    ngayNhan: new Date("2024-11-18"),
    ngayHenTra: new Date("2024-12-18"),
    assignee: "huong.tran@k-erp.com", // Trưởng phòng
    ghiChu: "Dự án lớn, cần phối hợp nhiều người",
  },
  {
    title: "Cắm mốc ranh giới đất 789",
    status: "Chờ xử lý",
    loaiHoSo: "Cắm mốc ranh",
    diaChi: "789 Hai Bà Trưng, Q.1, TP.HCM",
    dienTich: 320.8,
    nguoiYeuCau: "Lê Văn C",
    soDienThoai: "0923456789",
    ngayNhan: new Date("2024-11-25"),
    ngayHenTra: new Date("2024-12-02"),
    assignee: "lan.pham@k-erp.com",
    ghiChu: "Cần xác nhận ranh với hàng xóm",
  },
  {
    title: "Kiểm tra hiện trạng đất nông nghiệp",
    status: "Chờ xử lý",
    loaiHoSo: "Kiểm tra hiện trạng",
    diaChi: "Xã Tân Phú, Củ Chi",
    dienTich: 10000,
    nguoiYeuCau: "Hộ ông Nguyễn Văn D",
    soDienThoai: "0934567890",
    ngayNhan: new Date("2024-11-26"),
    ngayHenTra: new Date("2024-12-03"),
    assignee: "nam.hoang@k-erp.com",
    ghiChu: "Đất nông nghiệp, khó tiếp cận",
  },
  {
    title: "Đo đạc phân lô khu dân cư",
    status: "Đang xử lý",
    loaiHoSo: "Đo đạc phân lô",
    diaChi: "Phường Bình An, Q.2, TP.HCM",
    dienTich: 5000,
    nguoiYeuCau: "Công ty BĐS DEF",
    soDienThoai: "0945678901",
    ngayNhan: new Date("2024-11-10"),
    ngayHenTra: new Date("2024-12-10"),
    assignee: "huong.tran@k-erp.com",
    ghiChu: "20 lô, mỗi lô ~250m2",
  },
  {
    title: "Xác định ranh thửa đất tranh chấp",
    status: "Tạm dừng",
    loaiHoSo: "Giải quyết tranh chấp",
    diaChi: "234 Phan Văn Trị, Gò Vấp",
    dienTich: 150,
    nguoiYeuCau: "UBND Phường",
    soDienThoai: "0283789012",
    ngayNhan: new Date("2024-11-05"),
    ngayHenTra: new Date("2024-12-05"),
    assignee: "minh.le@k-erp.com", // Trưởng phòng KD
    ghiChu: "Chờ quyết định của UBND",
  },
  {
    title: "Đo đạc lập hồ sơ cấp sổ đỏ",
    status: "Đã hoàn thành",
    loaiHoSo: "Cấp sổ đỏ",
    diaChi: "567 Điện Biên Phủ, Q.Bình Thạnh",
    dienTich: 95.5,
    nguoiYeuCau: "Phạm Thị E",
    soDienThoai: "0956789012",
    ngayNhan: new Date("2024-10-20"),
    ngayHenTra: new Date("2024-11-20"),
    assignee: "lan.pham@k-erp.com",
    ghiChu: "Đã nộp hồ sơ",
  },
];

// Properties matching the survey template
const PROPERTIES = [
  {
    id: uuidv4(),
    name: "Trạng thái",
    type: "status",
    order: 0,
    options: [
      { id: uuidv4(), label: "Chờ xử lý", color: "bg-gray-100 text-gray-800" },
      { id: uuidv4(), label: "Đang xử lý", color: "bg-blue-100 text-blue-800" },
      { id: uuidv4(), label: "Đã hoàn thành", color: "bg-green-100 text-green-800" },
      { id: uuidv4(), label: "Tạm dừng", color: "bg-yellow-100 text-yellow-800" },
      { id: uuidv4(), label: "Hủy", color: "bg-red-100 text-red-800" },
    ],
  },
  { id: uuidv4(), name: "Loại hồ sơ", type: "select", order: 1, options: [
    { id: uuidv4(), label: "Đo đạc địa chính", color: "bg-blue-100 text-blue-800" },
    { id: uuidv4(), label: "Trích đo địa chính", color: "bg-cyan-100 text-cyan-800" },
    { id: uuidv4(), label: "Đo vẽ bản đồ", color: "bg-purple-100 text-purple-800" },
    { id: uuidv4(), label: "Cắm mốc ranh", color: "bg-orange-100 text-orange-800" },
    { id: uuidv4(), label: "Kiểm tra hiện trạng", color: "bg-teal-100 text-teal-800" },
    { id: uuidv4(), label: "Đo đạc phân lô", color: "bg-indigo-100 text-indigo-800" },
    { id: uuidv4(), label: "Giải quyết tranh chấp", color: "bg-red-100 text-red-800" },
    { id: uuidv4(), label: "Cấp sổ đỏ", color: "bg-green-100 text-green-800" },
  ]},
  { id: uuidv4(), name: "Địa chỉ", type: "text", order: 2 },
  { id: uuidv4(), name: "Diện tích (m²)", type: "number", order: 3 },
  { id: uuidv4(), name: "Người yêu cầu", type: "text", order: 4 },
  { id: uuidv4(), name: "Số điện thoại", type: "text", order: 5 },
  { id: uuidv4(), name: "Ngày nhận", type: "date", order: 6 },
  { id: uuidv4(), name: "Ngày hẹn trả", type: "date", order: 7 },
  { id: uuidv4(), name: "Người phụ trách", type: "user", order: 8 },
  { id: uuidv4(), name: "Ghi chú", type: "rich-text", order: 9 },
];

async function seedBoard() {
  try {
    const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected!");

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");
    const boardsCollection = db.collection("boards");
    const tasksCollection = db.collection("tasks");
    const boardMembersCollection = db.collection("boardmembers");

    // Get admin user
    const admin = await usersCollection.findOne({ email: "admin@k-erp.com" });
    if (!admin) {
      console.error("Admin user not found! Run seed-users.js first.");
      process.exit(1);
    }

    // Get all users for assignment lookup
    const allUsers = await usersCollection.find({}).toArray();
    const userEmailToId = {};
    allUsers.forEach((u) => {
      userEmailToId[u.email] = u._id.toString();
    });

    // Check if board already exists
    const existingBoard = await boardsCollection.findOne({ name: "Hồ sơ đo đạc 2024" });
    if (existingBoard) {
      console.log("Board 'Hồ sơ đo đạc 2024' already exists. Deleting and recreating...");
      await tasksCollection.deleteMany({ boardId: existingBoard._id });
      await boardMembersCollection.deleteMany({ boardId: existingBoard._id });
      await boardsCollection.deleteOne({ _id: existingBoard._id });
    }

    // Create the board
    const statusProp = PROPERTIES.find((p) => p.name === "Trạng thái");
    const board = {
      name: "Hồ sơ đo đạc 2024",
      description: "Quản lý các hồ sơ đo đạc địa chính năm 2024",
      icon: "📐",
      ownerId: admin._id,
      visibility: "workspace",
      properties: PROPERTIES,
      views: [
        {
          id: uuidv4(),
          name: "Bảng",
          type: "table",
          config: {
            visibleProperties: PROPERTIES.map((p) => p.id),
          },
          isDefault: true,
        },
        {
          id: uuidv4(),
          name: "Kanban",
          type: "kanban",
          config: {
            groupBy: statusProp?.id,
          },
          isDefault: false,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const boardResult = await boardsCollection.insertOne(board);
    const boardId = boardResult.insertedId;
    console.log(`✓ Created board: ${board.name}`);

    // Add board members
    const staffEmails = [
      "huong.tran@k-erp.com",
      "minh.le@k-erp.com",
      "lan.pham@k-erp.com",
      "nam.hoang@k-erp.com",
    ];

    // Add admin as owner
    await boardMembersCollection.insertOne({
      boardId: boardId,
      userId: admin._id,
      role: "owner",
      addedBy: admin._id,
      addedAt: new Date(),
    });

    // Add staff as editors
    for (const email of staffEmails) {
      const user = allUsers.find((u) => u.email === email);
      if (user) {
        await boardMembersCollection.insertOne({
          boardId: boardId,
          userId: user._id,
          role: "editor",
          addedBy: admin._id,
          addedAt: new Date(),
        });
        console.log(`  + Added member: ${user.name} (editor)`);
      }
    }

    // Create tasks
    const statusPropId = PROPERTIES.find((p) => p.name === "Trạng thái")?.id;
    const loaiHoSoPropId = PROPERTIES.find((p) => p.name === "Loại hồ sơ")?.id;
    const diaChiPropId = PROPERTIES.find((p) => p.name === "Địa chỉ")?.id;
    const dienTichPropId = PROPERTIES.find((p) => p.name === "Diện tích (m²)")?.id;
    const nguoiYeuCauPropId = PROPERTIES.find((p) => p.name === "Người yêu cầu")?.id;
    const soDienThoaiPropId = PROPERTIES.find((p) => p.name === "Số điện thoại")?.id;
    const ngayNhanPropId = PROPERTIES.find((p) => p.name === "Ngày nhận")?.id;
    const ngayHenTraPropId = PROPERTIES.find((p) => p.name === "Ngày hẹn trả")?.id;
    const nguoiPhuTrachPropId = PROPERTIES.find((p) => p.name === "Người phụ trách")?.id;
    const ghiChuPropId = PROPERTIES.find((p) => p.name === "Ghi chú")?.id;

    // Get status options
    const statusOptions = PROPERTIES.find((p) => p.name === "Trạng thái")?.options || [];
    const loaiHoSoOptions = PROPERTIES.find((p) => p.name === "Loại hồ sơ")?.options || [];

    for (let i = 0; i < SAMPLE_TASKS.length; i++) {
      const task = SAMPLE_TASKS[i];

      // Find matching option IDs
      const statusOption = statusOptions.find((o) => o.label === task.status);
      const loaiHoSoOption = loaiHoSoOptions.find((o) => o.label === task.loaiHoSo);
      const assigneeId = userEmailToId[task.assignee];

      const taskDoc = {
        boardId: boardId,
        title: task.title,
        order: i,
        properties: {
          [statusPropId]: statusOption?.id,
          [loaiHoSoPropId]: loaiHoSoOption?.id,
          [diaChiPropId]: task.diaChi,
          [dienTichPropId]: task.dienTich,
          [nguoiYeuCauPropId]: task.nguoiYeuCau,
          [soDienThoaiPropId]: task.soDienThoai,
          [ngayNhanPropId]: task.ngayNhan.toISOString(),
          [ngayHenTraPropId]: task.ngayHenTra.toISOString(),
          [nguoiPhuTrachPropId]: assigneeId,
          [ghiChuPropId]: task.ghiChu,
        },
        createdBy: admin._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await tasksCollection.insertOne(taskDoc);
      console.log(`  ✓ Task: ${task.title}`);
    }

    console.log("\n--- Summary ---");
    console.log(`Board: ${board.name}`);
    console.log(`Tasks: ${SAMPLE_TASKS.length}`);
    console.log(`Members: ${staffEmails.length + 1}`);

    await mongoose.disconnect();
    console.log("\nDone! 🎉");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

seedBoard();
