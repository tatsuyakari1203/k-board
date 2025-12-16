import { Suspense } from "react";
import { Link, redirect } from "@/i18n/routing";
import { RegisterForm } from "@/components/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import { getLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

async function checkSystemInitialization() {
  await connectDB();
  const count = await User.countDocuments({});
  return count > 0;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const isInitialized = await checkSystemInitialization();
  const locale = await getLocale();
  const { setup } = await searchParams;
  const isSetupMode = setup === "true";

  // If system is not initialized (no admin) and not in setup mode -> Redirect to setup
  if (!isInitialized && !isSetupMode) {
    redirect({ href: "/auth/register?setup=true", locale });
  }

  // If system is initialized (admin exists) and trying to access setup mode -> Redirect to normal register
  if (isInitialized && isSetupMode) {
    redirect({ href: "/auth/register", locale });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center px-6">
          <Link href="/" className="text-base font-semibold tracking-tight">
            K-Board
          </Link>
        </div>
      </header>

      {/* Form */}
      <main className="flex min-h-screen items-center justify-center px-6">
        <RegisterForm />
      </main>
    </div>
  );
}
