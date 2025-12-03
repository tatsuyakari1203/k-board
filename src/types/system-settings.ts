// System Settings Types (shared between client and server)

export type RegistrationMode = "auto_approve" | "manual_approve" | "disabled";

export const REGISTRATION_MODE = {
  AUTO_APPROVE: "auto_approve" as RegistrationMode,
  MANUAL_APPROVE: "manual_approve" as RegistrationMode,
  DISABLED: "disabled" as RegistrationMode,
} as const;

export const SETTING_KEYS = {
  REGISTRATION_MODE: "registration_mode",
  USER_REGISTRATION_MODE: "user_registration_mode",
} as const;
