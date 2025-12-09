"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface EmployeeStat {
  userId: string;
  name: string;
  email: string;
  image?: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  productivityScore: number;
  department?: string;
}

export default function EmployeeStatsPage() {
  const { data: stats, isLoading } = useQuery<EmployeeStat[]>({
    queryKey: ["admin-employee-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats/employees");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thống Kê Nhân Viên</h1>
          <p className="text-muted-foreground">Hiệu suất và năng suất làm việc</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead className="text-center">Tổng Task</TableHead>
                <TableHead className="text-center">Hoàn thành</TableHead>
                <TableHead className="text-center">Trễ hạn</TableHead>
                <TableHead className="w-[200px]">Tiến độ</TableHead>
                <TableHead className="text-right">Đánh giá</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.map((stat) => (
                <TableRow key={stat.userId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={stat.image} />
                        <AvatarFallback>{stat.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{stat.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {stat.department || "No Dept"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">{stat.totalTasks}</TableCell>
                  <TableCell className="text-center text-green-600 font-medium">
                    {stat.completedTasks}
                  </TableCell>
                  <TableCell className="text-center text-red-600 font-medium">
                    {stat.overdueTasks}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{stat.completionRate.toFixed(0)}%</span>
                      </div>
                      <Progress value={stat.completionRate} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {stat.productivityScore < 30 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="h-3 w-3" /> Yếu
                      </span>
                    ) : stat.productivityScore > 80 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3" /> Tốt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3" /> TB
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
