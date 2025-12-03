import { z } from "zod";
import { BOARD_VISIBILITY } from "@/types/board-member";

// Add board member
export const addBoardMemberSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  role: z.enum(["admin", "editor", "viewer", "restricted_editor", "restricted_viewer"], {
    message: "Vai trò không hợp lệ",
  }),
});

// Update board member role
export const updateBoardMemberSchema = z.object({
  role: z.enum(["admin", "editor", "viewer", "restricted_editor", "restricted_viewer"], {
    message: "Vai trò không hợp lệ",
  }),
});

// Invite to board
export const inviteBoardMemberSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  role: z.enum(["admin", "editor", "viewer", "restricted_editor", "restricted_viewer"], {
    message: "Vai trò không hợp lệ",
  }),
  message: z.string().max(500, "Tin nhắn không được quá 500 ký tự").optional(),
});

// Update board visibility
export const updateBoardVisibilitySchema = z.object({
  visibility: z.enum([
    BOARD_VISIBILITY.PRIVATE,
    BOARD_VISIBILITY.WORKSPACE,
    BOARD_VISIBILITY.PUBLIC,
  ], {
    message: "Chế độ hiển thị không hợp lệ",
  }),
});

// Accept/decline invitation
export const respondInvitationSchema = z.object({
  action: z.enum(["accept", "decline"], {
    message: "Hành động không hợp lệ",
  }),
});

export type AddBoardMemberInput = z.infer<typeof addBoardMemberSchema>;
export type UpdateBoardMemberInput = z.infer<typeof updateBoardMemberSchema>;
export type InviteBoardMemberInput = z.infer<typeof inviteBoardMemberSchema>;
export type UpdateBoardVisibilityInput = z.infer<typeof updateBoardVisibilitySchema>;
export type RespondInvitationInput = z.infer<typeof respondInvitationSchema>;
