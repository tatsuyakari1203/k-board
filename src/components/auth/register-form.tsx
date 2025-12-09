"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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

import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetupMode = searchParams.get("setup") === "true";

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Đã có lỗi xảy ra");
      }

      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
      router.push("/auth/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  }

  const inputClassName =
    "h-12 border-0 bg-secondary px-4 text-base shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/30";

  return (
    <div className="w-full max-w-md">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          {isSetupMode ? "Khởi tạo hệ thống" : "Tạo tài khoản"}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          {isSetupMode
            ? "Tạo tài khoản quản trị viên (Admin) đầu tiên cho hệ thống."
            : "Bắt đầu sử dụng K-Board miễn phí."}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-normal text-muted-foreground">
                  Họ và tên
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nguyễn Văn A"
                    disabled={isLoading}
                    className={inputClassName}
                    {...field}
                  />
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
                <FormLabel className="text-base font-normal text-muted-foreground">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    disabled={isLoading}
                    className={inputClassName}
                    {...field}
                  />
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
                <FormLabel className="text-base font-normal text-muted-foreground">
                  Mật khẩu
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    disabled={isLoading}
                    className={inputClassName}
                    {...field}
                  />
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
                <FormLabel className="text-base font-normal text-muted-foreground">
                  Xác nhận mật khẩu
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    disabled={isLoading}
                    className={inputClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="mt-8 h-12 w-full text-base font-medium"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Tạo tài khoản
          </Button>
        </form>
      </Form>

      <p className="mt-10 text-center text-base text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href="/auth/login" className="text-foreground underline-offset-4 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
