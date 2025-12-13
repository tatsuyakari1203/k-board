"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Pencil, Trash2, Shield } from "lucide-react";
import { RoleDialog } from "./role-dialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";
import { Role } from "@/types/role";

export function RoleList() {
  const t = useTranslations("AdminRoles");
  const tCommon = useTranslations("Common");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data } = await axios.get("/api/admin/roles");
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/admin/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      toast.success(t("deleteSuccess"));
      setRoleToDelete(null);
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || tCommon("error"));
    },
  });

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (roleToDelete) {
      deleteMutation.mutate(roleToDelete._id);
    }
  };

  if (isLoading) {
    return <div>{tCommon("loading")}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("createRole")}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("roleName")}</TableHead>
              <TableHead>{t("slug")}</TableHead>
              <TableHead>{t("permissions")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles?.map((role) => (
              <TableRow key={role._id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    {role.name}
                  </div>
                  {role.description && (
                    <div className="text-xs text-muted-foreground mt-1">{role.description}</div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {role.slug}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.length > 0 ? (
                      <>
                        <Badge variant="secondary" className="text-xs">
                          {role.permissions.length} {t("permissions").toLowerCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {role.permissions.slice(0, 3).join(", ")}
                          {role.permissions.length > 3 && "..."}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground text-xs">{t("noRoles")}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {role.isSystem ? (
                    <Badge variant="default">{t("system")}</Badge>
                  ) : (
                    <Badge variant="secondary">{t("custom")}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">{tCommon("actions")}</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{tCommon("actions")}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(role)}>
                        <Pencil className="mr-2 h-4 w-4" /> {tCommon("edit")}
                      </DropdownMenuItem>
                      {!role.isSystem && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setRoleToDelete(role)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> {tCommon("delete")}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {roles?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t("noRoles")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <RoleDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} role={selectedRole} />

      <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDesc", { name: roleToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
