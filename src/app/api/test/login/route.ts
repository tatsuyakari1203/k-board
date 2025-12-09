import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";

export async function POST(req: NextRequest) {
  // STRICTLY DEV ONLY
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not allowed", { status: 403 });
  }

  try {
    const { email } = await req.json();
    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Payload must match what the JWT callback produces
    const token = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      sub: user._id.toString(),
    };

    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET not set");

    // "authjs.session-token" is the default cookie name in NextAuth v5 for http (dev)
    const cookieName = "authjs.session-token";

    const encodedToken = await encode({
      token,
      secret,
      salt: cookieName,
    });

    const response = NextResponse.json({
      success: true,
      user: { email: user.email, role: user.role },
    });

    response.cookies.set(cookieName, encodedToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Backdoor login error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
