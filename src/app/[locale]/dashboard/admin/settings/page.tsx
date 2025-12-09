"use client";

import { useEffect, useState } from "react";
import { Settings, Loader2, Check, Info } from "lucide-react";
import { REGISTRATION_MODE, type RegistrationMode } from "@/types/system-settings";
import { useTranslations } from "next-intl";

interface SystemSettings {
  user_registration_mode: RegistrationMode;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const t = useTranslations("Admin.settingsPage");

  const REGISTRATION_MODE_OPTIONS: {
    value: RegistrationMode;
    label: string;
    description: string;
  }[] = [
    {
      value: REGISTRATION_MODE.AUTO_APPROVE,
      label: t("registrationMode.auto.label"),
      description: t("registrationMode.auto.desc"),
    },
    {
      value: REGISTRATION_MODE.MANUAL_APPROVE,
      label: t("registrationMode.manual.label"),
      description: t("registrationMode.manual.desc"),
    },
    {
      value: REGISTRATION_MODE.DISABLED,
      label: t("registrationMode.disabled.label"),
      description: t("registrationMode.disabled.desc"),
    },
  ];

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
        method: "PATCH",
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
    setSettings((prev) => (prev ? { ...prev, user_registration_mode: mode } : null));
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
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("subtitle")}</p>
      </div>

      {/* Registration Mode */}
      <div className="border rounded-lg">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">{t("registrationMode.title")}</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{t("registrationMode.desc")}</p>
        </div>

        <div className="p-4 space-y-3">
          {REGISTRATION_MODE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                settings?.user_registration_mode === option.value
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:border-border hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                name="registration_mode"
                value={option.value}
                checked={settings?.user_registration_mode === option.value}
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

        {settings?.user_registration_mode === REGISTRATION_MODE.MANUAL_APPROVE && (
          <div className="px-4 pb-4">
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-400">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">{t("registrationMode.manual.infoTitle")}</p>
                <p className="mt-1">{t("registrationMode.manual.infoDesc")}</p>
              </div>
            </div>
          </div>
        )}

        {settings?.user_registration_mode === REGISTRATION_MODE.DISABLED && (
          <div className="px-4 pb-4">
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-700 dark:text-amber-400">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">{t("registrationMode.disabled.infoTitle")}</p>
                <p className="mt-1">{t("registrationMode.disabled.infoDesc")}</p>
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
          {saveSuccess ? t("saved") : t("save")}
        </button>
        {saveSuccess && (
          <span className="text-sm text-green-600 dark:text-green-400">{t("success")}</span>
        )}
      </div>
    </div>
  );
}
