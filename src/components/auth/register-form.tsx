"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const registerSchema = z
  .object({
    name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(6, "Mật khẩu xác nhận phải có ít nhất 6 ký tự"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetupMode = searchParams.get("setup") === "true";
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json();
        // Handle Zod validation errors from backend
        if (data.details && data.details.fieldErrors) {
          const fieldErrors = data.details.fieldErrors;
          Object.keys(fieldErrors).forEach((key) => {
            form.setError(key as keyof z.infer<typeof registerSchema>, {
              type: "server",
              message: fieldErrors[key]?.[0],
            });
          });
          throw new Error("Dữ liệu không hợp lệ");
        }
        throw new Error(data.error || "Đăng ký thất bại");
      }

      showToast.success(
        isSetupMode ? t("setupSuccess") : "Đăng ký thành công! Đang chuyển hướng..."
      );
      router.push("/auth/login");
    } catch (error) {
      if (error instanceof Error) {
        showToast.error(error.message);
      } else {
        showToast.error("Đã có lỗi xảy ra");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader>
        {isSetupMode ? (
          <>
            <div className="flex items-center gap-2 text-primary mb-2">
              <ShieldCheck className="h-6 w-6" />
              <span className="font-semibold tracking-tight uppercase text-sm">
                {t("setupBadge")}
              </span>
            </div>
            <CardTitle className="text-2xl font-bold">{t("setupTitle")}</CardTitle>
            <CardDescription>{t("setupDesc")}</CardDescription>
          </>
        ) : (
          <>
            <CardTitle className="text-2xl">{t("register")}</CardTitle>
            <CardDescription>
              {t("dontHaveAccount")}{" "}
              <Link href="/auth/login" className="underline">
                {t("login")}
              </Link>
            </CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent>
        {isSetupMode && (
          <Alert className="mb-6 bg-blue-50 text-blue-900 border-blue-200">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>{t("setupAlertTitle")}</AlertTitle>
            <AlertDescription>{t("setupAlertDesc")}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên hiển thị</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("confirmPasswordLabel")}</FormLabel>
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
                t("register")
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
