import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import { registerSchema } from "@/lib/validations/auth";
import { USER_ROLES } from "@/types/user";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({
      email: validated.data.email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email đã được sử dụng" },
        { status: 409 }
      );
    }

    const user = await User.create({
      email: validated.data.email,
      name: validated.data.name,
      password: validated.data.password,
      role: USER_ROLES.USER,
    });

    return NextResponse.json(
      {
        message: "Đăng ký thành công",
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra" },
      { status: 500 }
    );
  }
}
