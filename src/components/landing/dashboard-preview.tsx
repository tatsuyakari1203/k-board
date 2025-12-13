"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  KanbanSquare,
  Settings,
  Users,
  Search,
  Bell,
  Plus,
  MoreHorizontal,
  Calendar,
  Paperclip,
  MessageSquare,
  MousePointer2,
  Table as TableIcon,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { useState, useEffect } from "react";

export function DashboardPreview() {
  const [activeView, setActiveView] = useState<"board" | "table">("board");

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveView((prev) => (prev === "board" ? "table" : "board"));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative rounded-xl bg-background border shadow-2xl overflow-hidden select-none pointer-events-none">
      <div className="flex h-[400px] md:h-[500px] w-full">
        {/* Sidebar */}
        <div className="w-16 md:w-64 border-r bg-muted/30 flex flex-col hidden md:flex">
          <div className="p-4 border-b h-14 flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              K
            </div>
            <span className="font-semibold text-sm">K-Board Workspace</span>
          </div>
          <div className="flex-1 py-4 space-y-1 px-2">
            {[
              { icon: KanbanSquare, label: "Product Roadmap", active: true },
              { icon: LayoutDashboard, label: "Marketing Campaign" },
              { icon: Users, label: "Team Members" },
              { icon: Settings, label: "Settings" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={`px-2 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 ${
                  item.active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </motion.div>
            ))}
          </div>
          <div className="p-4 border-t">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="text-xs">
                <div className="font-medium">John Doe</div>
                <div className="text-muted-foreground">Admin</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {/* Header */}
          <div className="h-14 border-b flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-4">
              <h2 className="font-semibold text-sm md:text-base">Product Roadmap</h2>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center bg-muted/50 p-1 rounded-md mr-2">
                <div
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    activeView === "board"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <KanbanSquare className="h-3.5 w-3.5" />
                  Board
                </div>
                <div
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    activeView === "table"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <TableIcon className="h-3.5 w-3.5" />
                  Table
                </div>
              </div>
              <div className="flex -space-x-2">
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="bg-blue-500 text-white text-[10px]">A</AvatarFallback>
                </Avatar>
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="bg-green-500 text-white text-[10px]">B</AvatarFallback>
                </Avatar>
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="bg-yellow-500 text-white text-[10px]">
                    +
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden md:flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md text-xs">
                <Search className="h-3.5 w-3.5" />
                <span>Search...</span>
                <span className="ml-4 text-[10px] border px-1 rounded">⌘K</span>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Board Area */}
          <div className="flex-1 p-4 md:p-6 overflow-hidden bg-muted/10 relative">
            {/* Fake Cursor Animation */}
            <motion.div
              className="absolute top-0 left-0 z-50 pointer-events-none text-foreground drop-shadow-md hidden md:block"
              animate={
                activeView === "board"
                  ? {
                      x: [500, 140, 140, 440, 440, 500],
                      y: [300, 120, 120, 120, 120, 300],
                      opacity: [0, 1, 1, 1, 0, 0],
                      scale: [1, 1, 0.85, 0.85, 1, 1],
                    }
                  : {
                      x: [500, 280, 280, 280, 280, 500],
                      y: [300, 160, 160, 160, 160, 300],
                      opacity: [0, 1, 1, 1, 0, 0],
                      scale: [1, 1, 0.85, 0.85, 1, 1],
                    }
              }
              transition={{
                duration: 8,
                ease: "easeInOut",
                times: [0, 0.2, 0.25, 0.5, 0.55, 1],
              }}
            >
              <MousePointer2 className="h-5 w-5 fill-foreground" />
            </motion.div>

            <AnimatePresence mode="wait">
              {activeView === "board" ? (
                <motion.div
                  key="board"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="flex gap-4 h-full"
                >
                  {/* Column 1: To Do */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="w-60 md:w-72 flex-shrink-0 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-400" />
                        <span className="text-sm font-medium">To Do</span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                          3
                        </span>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        x: [0, 0, 0, 300, 300, 0],
                        rotate: [0, 0, -3, 3, 0, 0],
                        scale: [1, 1, 1.05, 1.05, 1, 1],
                        zIndex: [0, 0, 50, 50, 0, 0],
                      }}
                      transition={{
                        delay: 0.5,
                        opacity: { duration: 0.4 },
                        y: { duration: 0.4 },
                        x: {
                          duration: 8,
                          repeat: Infinity,
                          ease: "easeInOut",
                          times: [0, 0.2, 0.25, 0.5, 0.55, 1],
                          repeatDelay: 1,
                        },
                        rotate: {
                          duration: 8,
                          repeat: Infinity,
                          ease: "easeInOut",
                          times: [0, 0.2, 0.25, 0.5, 0.55, 1],
                          repeatDelay: 1,
                        },
                        scale: {
                          duration: 8,
                          repeat: Infinity,
                          ease: "easeInOut",
                          times: [0, 0.2, 0.25, 0.5, 0.55, 1],
                          repeatDelay: 1,
                        },
                        zIndex: {
                          duration: 8,
                          repeat: Infinity,
                          times: [0, 0.2, 0.25, 0.5, 0.55, 1],
                          repeatDelay: 1,
                        },
                      }}
                    >
                      <Card className="p-3 shadow-sm hover:shadow-md transition-shadow cursor-default relative bg-card">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium leading-tight">
                              Research competitors
                            </span>
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-5 font-normal bg-orange-100 text-orange-700 hover:bg-orange-100 border-0"
                            >
                              High
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-5 font-normal bg-blue-100 text-blue-700 hover:bg-blue-100 border-0"
                            >
                              Strategy
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <div className="flex items-center gap-1 text-[10px]">
                                <MessageSquare className="h-3 w-3" /> 2
                              </div>
                            </div>
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px] bg-pink-500 text-white">
                                JD
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Card className="p-3 shadow-sm hover:shadow-md transition-shadow cursor-default">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium leading-tight">
                              Update documentation
                            </span>
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-5 font-normal bg-slate-100 text-slate-700 hover:bg-slate-100 border-0"
                            >
                              Low
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <div className="flex items-center gap-1 text-[10px]">
                                <Paperclip className="h-3 w-3" /> 1
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </motion.div>

                  {/* Column 2: In Progress */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="w-60 md:w-72 flex-shrink-0 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium">In Progress</span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                          2
                        </span>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card className="p-3 shadow-sm hover:shadow-md transition-shadow cursor-default border-l-4 border-l-blue-500">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium leading-tight">
                              Design system implementation
                            </span>
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                          <div className="w-full h-24 bg-muted rounded-md overflow-hidden mb-2 relative">
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                              Image Preview
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-5 font-normal bg-purple-100 text-purple-700 hover:bg-purple-100 border-0"
                            >
                              Design
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <div className="flex items-center gap-1 text-[10px] text-orange-600">
                                <Calendar className="h-3 w-3" /> Tomorrow
                              </div>
                            </div>
                            <div className="flex -space-x-1.5">
                              <Avatar className="h-5 w-5 border border-background">
                                <AvatarFallback className="text-[10px] bg-green-500 text-white">
                                  A
                                </AvatarFallback>
                              </Avatar>
                              <Avatar className="h-5 w-5 border border-background">
                                <AvatarFallback className="text-[10px] bg-blue-500 text-white">
                                  B
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </motion.div>

                  {/* Column 3: Done */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="w-60 md:w-72 flex-shrink-0 flex flex-col gap-3 hidden sm:flex"
                  >
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm font-medium">Done</span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                          5
                        </span>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <Card className="p-3 shadow-sm hover:shadow-md transition-shadow cursor-default opacity-75">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium leading-tight line-through text-muted-foreground">
                              Initial project setup
                            </span>
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-5 font-normal bg-slate-100 text-slate-700 hover:bg-slate-100 border-0"
                            >
                              Dev
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                    >
                      <Card className="p-3 shadow-sm hover:shadow-md transition-shadow cursor-default opacity-75">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium leading-tight line-through text-muted-foreground">
                              Database schema design
                            </span>
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="table"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full bg-background rounded-md border shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="flex items-center border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
                    <div className="flex-1 min-w-[200px]">Task Name</div>
                    <div className="w-24">Status</div>
                    <div className="w-24">Priority</div>
                    <div className="w-24">Assignee</div>
                    <div className="w-24">Due Date</div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {[
                      {
                        title: "Research competitors",
                        status: "To Do",
                        priority: "High",
                        assignee: "JD",
                        date: "Tomorrow",
                      },
                      {
                        title: "Design system implementation",
                        status: "In Progress",
                        priority: "Medium",
                        assignee: "AB",
                        date: "Next Week",
                      },
                      {
                        title: "Update documentation",
                        status: "To Do",
                        priority: "Low",
                        assignee: "JD",
                        date: "Today",
                      },
                      {
                        title: "Database schema design",
                        status: "Done",
                        priority: "High",
                        assignee: "AB",
                        date: "Yesterday",
                      },
                    ].map((task, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center border-b px-4 py-3 text-sm hover:bg-muted/50 transition-colors group relative"
                      >
                        <div className="flex-1 min-w-[200px] font-medium flex items-center gap-2">
                          {task.status === "Done" && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          )}
                          {task.title}
                        </div>
                        <div className="w-24">
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {task.status}
                          </Badge>
                          {i === 1 && (
                            <motion.div
                              className="absolute left-[220px] top-8 z-10 bg-popover border rounded-md shadow-md p-1 w-24 flex flex-col gap-1"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{
                                opacity: [0, 0, 1, 1, 0],
                                scale: [0.9, 0.9, 1, 1, 0.9],
                              }}
                              transition={{
                                duration: 8,
                                times: [0, 0.25, 0.3, 0.5, 0.55],
                                repeat: Infinity,
                                repeatDelay: 0,
                              }}
                            >
                              <div className="text-[10px] px-2 py-1 rounded hover:bg-muted cursor-pointer">
                                To Do
                              </div>
                              <div className="text-[10px] px-2 py-1 rounded bg-muted cursor-pointer">
                                In Progress
                              </div>
                              <div className="text-[10px] px-2 py-1 rounded hover:bg-muted cursor-pointer">
                                Done
                              </div>
                            </motion.div>
                          )}
                        </div>
                        <div className="w-24">
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="w-24 flex -space-x-2">
                          <Avatar className="h-5 w-5 border border-background">
                            <AvatarFallback className="text-[9px]">{task.assignee}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="w-24 text-muted-foreground text-xs">{task.date}</div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {/* Overlay gradient to make it look like it fades out or is just a preview */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
