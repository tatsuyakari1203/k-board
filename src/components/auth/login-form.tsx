"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t("emailInvalid")),
    password: z.string().min(1, t("passwordRequired")),
  });

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const tVal = useTranslations("Validation");

  // Create schema
  const loginSchema = createLoginSchema(tVal);
  type LoginFormValues = z.infer<typeof loginSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      await login(data.email, data.password, callbackUrl || undefined);
      showToast.success(tVal("loginSuccess"));
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific error messages
        if (error.message.includes("PENDING_APPROVAL") || error.message.includes("chờ phê duyệt")) {
          showToast.error("Tài khoản đang chờ phê duyệt. Vui lòng liên hệ quản trị viên.");
        } else if (error.message.includes("REJECTED") || error.message.includes("từ chối")) {
          showToast.error("Tài khoản đã bị từ chối. Vui lòng liên hệ quản trị viên.");
        } else if (error.message.includes("INACTIVE") || error.message.includes("vô hiệu hóa")) {
          showToast.error("Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
        } else if (error.message === "Email hoặc mật khẩu không đúng") {
          showToast.error(tVal("loginError"));
        } else {
          // Fallback for other errors
          showToast.error(error.message || tVal("loginError"));
        }
      } else {
        showToast.error(tVal("loginError"));
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader>
        <CardTitle className="text-2xl">{t("login")}</CardTitle>
        <CardDescription>
          {t("dontHaveAccount")}{" "}
          <Link href="/auth/register" className="underline">
            {t("register")}
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input placeholder="m@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("password")}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon("loading")}
                </>
              ) : (
                t("login")
              )}
            </Button>
            <div className="mt-4 text-center text-sm">
              <Link href="/auth/forgot-password" className="underline text-muted-foreground">
                {t("forgotPassword")}
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
