"use client";

import { motion } from "framer-motion";
import {
  LayoutGrid,
  Users,
  CheckSquare,
  Layers,
  Lock,
  Zap,
} from "lucide-react";

export function HeroText() {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.15] text-foreground"
    >
      Tổ chức công việc
      <br />
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        một cách thông minh
      </motion.span>
    </motion.h1>
  );
}

export function HeroDescription() {
  return (
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="mt-6 text-lg text-muted-foreground leading-relaxed"
    >
      Quản lý dự án, theo dõi tiến độ và cộng tác với đội nhóm
      trên một nền tảng duy nhất.
    </motion.p>
  );
}

export function HeroButtons({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="mt-10 flex items-center gap-4"
    >
      {children}
    </motion.div>
  );
}

const features = [
  {
    icon: LayoutGrid,
    title: "Bảng dự án",
    description: "Tạo và quản lý nhiều bảng với các trường thông tin linh hoạt theo nhu cầu.",
  },
  {
    icon: Layers,
    title: "Đa dạng chế độ xem",
    description: "Chuyển đổi giữa dạng bảng và Kanban để theo dõi công việc.",
  },
  {
    icon: Users,
    title: "Cộng tác nhóm",
    description: "Mời thành viên và làm việc cùng nhau một cách hiệu quả.",
  },
  {
    icon: Lock,
    title: "Phân quyền",
    description: "Thiết lập quyền xem, chỉnh sửa cho từng thành viên trong dự án.",
  },
  {
    icon: CheckSquare,
    title: "Quản lý công việc",
    description: "Theo dõi các nhiệm vụ được giao, cập nhật trạng thái dễ dàng.",
  },
  {
    icon: Zap,
    title: "Nhanh chóng",
    description: "Giao diện đơn giản, dễ sử dụng ngay từ lần đầu tiên.",
  },
];

export function FeaturesSection() {
  return (
    <div className="mt-32">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-2xl font-semibold text-foreground mb-10"
      >
        Tính năng
      </motion.h2>

      <div className="grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            className="group cursor-default"
          >
            <div className="flex items-center gap-3 mb-2">
              <feature.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              <h3 className="text-base font-medium text-foreground">{feature.title}</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function CTASection({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="mt-32 py-16 px-10 rounded-xl bg-muted/50"
    >
      <motion.h2
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-semibold text-foreground"
      >
        Sẵn sàng bắt đầu?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="mt-2 text-muted-foreground"
      >
        Tạo tài khoản miễn phí và khám phá ngay hôm nay.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
