"use client";

import { useEffect, useState } from "react";
import { Settings, Loader2, Check, Info } from "lucide-react";
import { REGISTRATION_MODE, type RegistrationMode } from "@/types/system-settings";

const REGISTRATION_MODE_OPTIONS: {
  value: RegistrationMode;
  label: string;
  description: string;
}[] = [
  {
    value: REGISTRATION_MODE.AUTO_APPROVE,
    label: "Tự động phê duyệt",
    description: "Người dùng đăng ký sẽ được tự động phê duyệt và có thể đăng nhập ngay.",
  },
  {
    value: REGISTRATION_MODE.MANUAL_APPROVE,
    label: "Phê duyệt thủ công",
    description: "Admin phải duyệt thủ công từng người dùng mới đăng ký.",
  },
  {
    value: REGISTRATION_MODE.DISABLED,
    label: "Không cho phép đăng ký",
    description: "Tắt tính năng đăng ký công khai. Chỉ admin mới có thể tạo tài khoản.",
  },
];

interface SystemSettings {
  registration_mode: RegistrationMode;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleModeChange = (mode: RegistrationMode) => {
    setSettings((prev) => prev ? { ...prev, registration_mode: mode } : null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cài đặt hệ thống</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Quản lý các cài đặt chung của hệ thống
        </p>
      </div>

      {/* Registration Mode */}
      <div className="border rounded-lg">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Chế độ đăng ký</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cấu hình cách hệ thống xử lý khi có người dùng mới đăng ký
          </p>
        </div>

        <div className="p-4 space-y-3">
          {REGISTRATION_MODE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                settings?.registration_mode === option.value
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:border-border hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                name="registration_mode"
                value={option.value}
                checked={settings?.registration_mode === option.value}
                onChange={() => handleModeChange(option.value)}
                className="mt-1"
              />
              <div>
                <p className="font-medium">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </label>
          ))}
        </div>

        {settings?.registration_mode === REGISTRATION_MODE.MANUAL_APPROVE && (
          <div className="px-4 pb-4">
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-400">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Lưu ý về chế độ phê duyệt thủ công</p>
                <p className="mt-1">
                  Khi có người dùng mới đăng ký, họ sẽ ở trạng thái &quot;Chờ duyệt&quot; và không thể đăng nhập.
                  Bạn cần vào trang <strong>Quản lý người dùng</strong> để phê duyệt hoặc từ chối.
                </p>
              </div>
            </div>
          </div>
        )}

        {settings?.registration_mode === REGISTRATION_MODE.DISABLED && (
          <div className="px-4 pb-4">
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-700 dark:text-amber-400">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Đăng ký đã bị tắt</p>
                <p className="mt-1">
                  Người dùng mới sẽ không thể tự đăng ký. Chỉ admin mới có thể tạo tài khoản mới
                  thông qua trang <strong>Quản lý người dùng</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saveSuccess ? (
            <Check className="h-4 w-4" />
          ) : null}
          {saveSuccess ? "Đã lưu" : "Lưu thay đổi"}
        </button>
        {saveSuccess && (
          <span className="text-sm text-green-600 dark:text-green-400">
            Cài đặt đã được cập nhật thành công!
          </span>
        )}
      </div>
    </div>
  );
}
