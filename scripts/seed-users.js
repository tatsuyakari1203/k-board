const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const USERS = [
  // Admins
  {
    name: "Nguyễn Văn Admin",
    email: "admin@k-erp.com",
    password: "123456",
    role: "admin",
    department: "Ban Giám đốc",
    position: "Quản trị viên hệ thống",
    phone: "0901234567",
  },
  // Managers
  {
    name: "Trần Thị Hương",
    email: "huong.tran@k-erp.com",
    password: "123456",
    role: "manager",
    department: "Phòng Kỹ thuật",
    position: "Trưởng phòng",
    phone: "0912345678",
  },
  {
    name: "Lê Văn Minh",
    email: "minh.le@k-erp.com",
    password: "123456",
    role: "manager",
    department: "Phòng Kinh doanh",
    position: "Trưởng phòng",
    phone: "0923456789",
  },
  // Staff
  {
    name: "Phạm Thị Lan",
    email: "lan.pham@k-erp.com",
    password: "123456",
    role: "staff",
    department: "Phòng Kỹ thuật",
    position: "Kỹ sư đo đạc",
    phone: "0934567890",
  },
  {
    name: "Hoàng Văn Nam",
    email: "nam.hoang@k-erp.com",
    password: "123456",
    role: "staff",
    department: "Phòng Kỹ thuật",
    position: "Kỹ sư trắc địa",
    phone: "0945678901",
  },
  {
    name: "Ngô Thị Mai",
    email: "mai.ngo@k-erp.com",
    password: "123456",
    role: "staff",
    department: "Phòng Kinh doanh",
    position: "Nhân viên kinh doanh",
    phone: "0956789012",
  },
  {
    name: "Đỗ Văn Tùng",
    email: "tung.do@k-erp.com",
    password: "123456",
    role: "staff",
    department: "Phòng Kế toán",
    position: "Kế toán viên",
    phone: "0967890123",
  },
  {
    name: "Vũ Thị Hạnh",
    email: "hanh.vu@k-erp.com",
    password: "123456",
    role: "staff",
    department: "Phòng Nhân sự",
    position: "Chuyên viên nhân sự",
    phone: "0978901234",
  },
  // Users
  {
    name: "Bùi Văn Đức",
    email: "duc.bui@k-erp.com",
    password: "123456",
    role: "user",
    department: "Phòng Kỹ thuật",
    position: "Thực tập sinh",
    phone: "0989012345",
  },
  {
    name: "Đinh Thị Nga",
    email: "nga.dinh@k-erp.com",
    password: "123456",
    role: "user",
    department: "Phòng Kinh doanh",
    position: "Thực tập sinh",
    phone: "0990123456",
  },
];

async function seedUsers() {
  try {
    const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected!");

    const usersCollection = mongoose.connection.db.collection("users");

    for (const userData of USERS) {
      // Check if user already exists
      const existing = await usersCollection.findOne({ email: userData.email });

      if (existing) {
        // Update existing user with new fields
        await usersCollection.updateOne(
          { email: userData.email },
          {
            $set: {
              department: userData.department,
              position: userData.position,
              phone: userData.phone,
              status: "approved",
              isActive: true,
            },
          }
        );
        console.log(`✓ Updated: ${userData.name} (${userData.email})`);
      } else {
        // Create new user
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        await usersCollection.insertOne({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          department: userData.department,
          position: userData.position,
          phone: userData.phone,
          status: "approved",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✓ Created: ${userData.name} (${userData.email})`);
      }
    }

    // Show summary
    const counts = await usersCollection.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]).toArray();

    console.log("\n--- Summary ---");
    counts.forEach((c) => console.log(`${c._id}: ${c.count}`));
    console.log(`Total: ${counts.reduce((sum, c) => sum + c.count, 0)}`);

    await mongoose.disconnect();
    console.log("\nDone!");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

seedUsers();
