import "dotenv/config";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import { USER_ROLES } from "@/types/user";

async function seedAdmin() {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ role: USER_ROLES.ADMIN });

    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.email);
      return;
    }

    const admin = await User.create({
      email: "admin@k-erp.com",
      name: "Administrator",
      password: "admin123456",
      role: USER_ROLES.ADMIN,
      isActive: true,
    });

    console.log("Admin user created successfully!");
    console.log("Email:", admin.email);
    console.log("Password: admin123456");
    console.log("⚠️  Please change this password immediately!");
  } catch (error) {
    console.error("Error seeding admin:", error);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
