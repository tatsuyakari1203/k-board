import "dotenv/config";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import { USER_ROLES, USER_STATUS } from "@/types/user";

async function createTestAdmin() {
  try {
    await connectDB();
    const email = "admin-test@k-board.com";
    const password = "admin123456";

    // Delete if exists to ensuring clean password
    await User.deleteOne({ email });

    await User.create({
      email,
      name: "Test Administrator",
      password, // Pre-save hook will hash this
      role: USER_ROLES.ADMIN,
      status: USER_STATUS.APPROVED,
      isActive: true,
      approvedAt: new Date(),
    });

    console.log(`✅ Created test admin: ${email} / ${password}`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

createTestAdmin();
