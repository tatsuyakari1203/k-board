import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import { SettingsService } from "@/services/settings.service";
import { REGISTRATION_MODE } from "@/types/system-settings";
import { USER_ROLES, USER_STATUS, UserRole } from "@/types/user";
import { z } from "zod";
import { registerSchema } from "@/lib/validations/auth";

export class AuthService {
  static async register(data: z.infer<typeof registerSchema>) {
    await connectDB();

    // Check for existing users to determine if this is the first user (First Run)
    const userCount = await User.countDocuments({});
    const isFirstUser = userCount === 0;

    // Check registration mode (bypass if it's the first user)
    const registrationMode = await SettingsService.getRegistrationMode();

    if (!isFirstUser && registrationMode === REGISTRATION_MODE.DISABLED) {
      throw new Error("Registration_Disabled");
    }

    const existingUser = await User.findOne({
      email: data.email.toLowerCase(),
    });

    if (existingUser) {
      throw new Error("Email_Exists");
    }

    // Determine status, role and isActive
    // If first user: Always ADMIN, APPROVED, ACTIVE
    // Otherwise: Follow registration mode
    const isAutoApprove = registrationMode === REGISTRATION_MODE.AUTO_APPROVE; // Default rule

    let status = isAutoApprove ? USER_STATUS.APPROVED : USER_STATUS.PENDING;
    let isActive = isAutoApprove;
    let role: UserRole = USER_ROLES.USER;

    if (isFirstUser) {
      status = USER_STATUS.APPROVED;
      isActive = true;
      role = USER_ROLES.ADMIN;
    }

    const user = await User.create({
      email: data.email,
      name: data.name,
      password: data.password,
      role: role,
      status,
      isActive,
      ...((isAutoApprove || isFirstUser) && { approvedAt: new Date() }),
    });

    return {
      user,
      isAutoApprove: isAutoApprove || isFirstUser, // First user is effectively auto approved
    };
  }
}
