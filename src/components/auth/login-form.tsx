"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
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

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { useAuth } from "@/hooks/use-auth";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    try {
      await login(data.email, data.password, callbackUrl || undefined);
      toast.success("Đăng nhập thành công!");
    } catch {
      toast.error("Email hoặc mật khẩu không đúng");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Đăng nhập</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Chào mừng trở lại. Nhập thông tin để tiếp tục.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-normal text-muted-foreground">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    disabled={isLoading}
                    className="h-12 border-0 bg-secondary px-4 text-base shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/30"
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
                    className="h-12 border-0 bg-secondary px-4 text-base shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/30"
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
            Tiếp tục
          </Button>
        </form>
      </Form>

      <p className="mt-10 text-center text-base text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link
          href="/auth/register"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Tạo tài khoản
        </Link>
      </p>
    </div>
  );
}
