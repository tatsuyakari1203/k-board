import "dotenv/config";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import { getSetting, setSetting, SETTING_KEYS, REGISTRATION_MODE } from "@/models/system-settings.model";
import { USER_ROLES, USER_STATUS } from "@/types/user";

async function seedAdmin() {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ role: USER_ROLES.ADMIN });

    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.email);

      // Ensure admin is approved
      if (existingAdmin.status !== USER_STATUS.APPROVED) {
        await User.updateOne(
          { _id: existingAdmin._id },
          {
            status: USER_STATUS.APPROVED,
            isActive: true,
            approvedAt: new Date()
          }
        );
        console.log("Updated existing admin to approved status");
      }
    } else {
      const admin = await User.create({
        email: "admin@k-erp.com",
        name: "Administrator",
        password: "admin123456",
        role: USER_ROLES.ADMIN,
        isActive: true,
        status: USER_STATUS.APPROVED,
        approvedAt: new Date(),
      });

      console.log("Admin user created successfully!");
      console.log("Email:", admin.email);
      console.log("Password: admin123456");
      console.log("⚠️  Please change this password immediately!");
    }

    // Initialize default system settings
    const existingMode = await getSetting(SETTING_KEYS.USER_REGISTRATION_MODE);
    if (!existingMode) {
      await setSetting(
        SETTING_KEYS.USER_REGISTRATION_MODE,
        REGISTRATION_MODE.MANUAL_APPROVE
      );
      console.log("Default registration mode set to: manual_approve");
    } else {
      console.log("Registration mode already set:", existingMode);
    }

  } catch (error) {
    console.error("Error seeding admin:", error);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
