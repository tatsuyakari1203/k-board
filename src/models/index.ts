export { default as User } from "./user.model";
export type { IUserDocument } from "./user.model";

export {
  default as SystemSettings,
  REGISTRATION_MODE,
  SETTING_KEYS,
  getSetting,
  setSetting,
  getRegistrationMode,
} from "./system-settings.model";
export type { ISystemSettingsDocument, RegistrationMode } from "./system-settings.model";
