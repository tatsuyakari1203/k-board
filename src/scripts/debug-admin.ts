import "dotenv/config";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";

async function debugAdmin() {
  try {
    await connectDB();
    const email = "admin-test@k-board.com";
    const user = await User.findOne({ email });
    console.log("User:", user?.toJSON());
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

debugAdmin();
