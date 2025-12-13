"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { Role } from "@/types/role";

const PERMISSION_IDS = [
  "board.view",
  "view.scope.assigned",
  "task.create",
  "task.edit",
  "edit.scope.assigned",
  "task.delete",
  "board.edit",
  "members.manage",
  "board.delete",
];

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role | null;
}

export function RoleDialog({ open, onOpenChange, role }: RoleDialogProps) {
  const t = useTranslations("AdminRoles");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const isEditing = !!role;

  const roleSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z
      .string()
      .min(2, "Slug must be at least 2 characters")
      .regex(/^[a-z0-9_]+$/, "Slug must contain only lowercase letters, numbers, and underscores"),
    description: z.string().optional(),
    permissions: z.array(z.string()).default([]),
  });

  type RoleFormValues = z.infer<typeof roleSchema>;

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      permissions: [],
    },
  });

  useEffect(() => {
    if (role) {
      form.reset({
        name: role.name,
        slug: role.slug,
        description: role.description || "",
        permissions: role.permissions || [],
      });
    } else {
      form.reset({
        name: "",
        slug: "",
        description: "",
        permissions: [],
      });
    }
  }, [role, form]);

  const mutation = useMutation({
    mutationFn: async (values: RoleFormValues) => {
      if (isEditing) {
        const { data } = await axios.put(`/api/admin/roles/${role._id}`, values);
        return data;
      } else {
        const { data } = await axios.post("/api/admin/roles", values);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      toast.success(isEditing ? t("updateSuccess") : t("createSuccess"));
      onOpenChange(false);
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || tCommon("error"));
    },
  });

  function onSubmit(values: RoleFormValues) {
    mutation.mutate(values);
  }

  const permissionsList = useMemo(() => {
    return PERMISSION_IDS.map((id) => ({
      id,
      label: t(`permissionsList.${id.replace(/\./g, "_")}`),
    }));
  }, [t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("editRole") : t("createRole")}</DialogTitle>
          <DialogDescription>{isEditing ? t("description") : t("description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.nameLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.namePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.slugLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("form.slugPlaceholder")}
                        {...field}
                        disabled={isEditing && role?.isSystem}
                      />
                    </FormControl>
                    <FormDescription>{t("form.slugDesc")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.descLabel")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("form.descPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>{t("form.permissionsLabel")}</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                {permissionsList.map((permission) => (
                  <FormField
                    key={permission.id}
                    control={form.control}
                    name="permissions"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={permission.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(permission.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), permission.id])
                                  : field.onChange(
                                      (field.value || []).filter((value) => value !== permission.id)
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {permission.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t("form.saving") : t("form.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
