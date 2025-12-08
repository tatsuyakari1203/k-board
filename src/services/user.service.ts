import User, { IUserDocument } from "@/models/user.model";
import { USER_STATUS } from "@/types/user";
import { connectDB } from "@/lib/db";

interface UserFilters {
  status?: string;
  role?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export class UserService {
  static async getUsers(filters: UserFilters) {
    await connectDB();
    const { status, role, isActive, search, page = 1, limit = 20 } = filters;

    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(query);
    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return { users, total };
  }

  static async getActiveUsers() {
    await connectDB();
    return User.find({
      isActive: true,
      status: USER_STATUS.APPROVED,
    })
      .select("_id name email image role phone department position createdAt")
      .sort({ name: 1 })
      .lean();
  }

  static async getUserCounts() {
    await connectDB();
    const statusCounts = await User.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);

    const counts = {
      total: await User.countDocuments({}),
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    statusCounts.forEach((s) => {
      if (s._id === USER_STATUS.PENDING) counts.pending = s.count;
      if (s._id === USER_STATUS.APPROVED) counts.approved = s.count;
      if (s._id === USER_STATUS.REJECTED) counts.rejected = s.count;
    });

    return counts;
  }

  static async createUser(data: Partial<IUserDocument>, createdBy: string) {
    await connectDB();

    // Check email
    const existingUser = await User.findOne({
      email: data.email?.toLowerCase(),
    });

    if (existingUser) {
      throw new Error("Email_Exists");
    }

    const user = await User.create({
      ...data,
      status: USER_STATUS.APPROVED,
      isActive: data.isActive ?? true,
      approvedBy: createdBy,
      approvedAt: new Date(),
      createdBy: createdBy,
    });

    return user;
  }
}
