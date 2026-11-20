"use client";
import { t as translateCopy } from "@/lib/i18n";


import React, { startTransition, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { t, type Locale } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  DEFAULT_PREFERENCES,
  readPreferences,
  writePreferences,
  type AppPreferences,
} from "@/lib/preferences";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ValidationErrors {
  [key: string]: string;
}

// Native language names for the language switcher. Keys match the Locale type.
const LANGUAGE_OPTIONS: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ha", label: "Harshen Hausa" },
  { value: "yo", label: "Èdè Yorùbá" },
  { value: "ig", label: "Asụsụ Igbo" },
];

const LOCALE_COOKIE = "locale";
const LOCALE_STORAGE_KEY = "locale";

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border-default bg-card p-5 md:p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <hr className="border-border-default" />;
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  // Stable IDs derived from the label text so the switch button can reference
  // its visible label and optional description via aria-labelledby /
  // aria-describedby rather than a duplicated aria-label string.
  const baseId = `toggle-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const labelId = `${baseId}-label`;
  const descriptionId = `${baseId}-description`;

  /**
   * Space is the native toggle key for role="switch" (already handled by the
   * browser for <button>). We add Enter so users who habitually press Enter to
   * activate controls also get the expected behaviour.
   */
  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      onChange(!checked);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p id={labelId} className="text-sm font-medium text-text-primary">
          {label}
        </p>
        {description && (
          <p id={descriptionId} className="text-xs text-text-secondary mt-0.5">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={() => onChange(!checked)}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
          checked ? "bg-gold" : "bg-bg-elevated"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-text-primary shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function SelectField({
  label,
  description,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}) {
  const fieldId = `setting-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;
  const describedBy = [description && descriptionId, error && errorId]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
      <div className="flex-1">
        <label htmlFor={fieldId} className="text-sm font-medium text-text-primary">{label}</label>
        {description && (
          <p id={descriptionId} className="text-xs text-text-secondary mt-0.5">{description}</p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-status-danger mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 10a1 1 0 110 2 1 1 0 010-2zm0-7a1 1 0 011 1v4a1 1 0 11-2 0V5a1 1 0 011-1z" />
            </svg>
            {error}
          </p>
        )}
      </div>
      <select
        id={fieldId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`rounded-lg border ${error ? "border-status-danger" : "border-border-default"} bg-bg-input text-text-primary text-sm px-3 py-2 focus:outline-none focus:border-border-focus transition-colors sm:w-44`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { locale, setLocale } = useLocale();
  const {
    address,
    isAuthenticated,
    isWalletConnected,
    isWalletDetected,
    isLoading,
    connectWallet,
    authenticate,
    logout,
  } = useAuth();

  const [notifications, setNotifications] = useState(DEFAULT_PREFERENCES.notifications);
  const [prefs, setPrefs] = useState<Pick<AppPreferences, "network" | "currency" | "autoSignOut">>(DEFAULT_PREFERENCES);

  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );

  useEffect(() => {
    const saved = readPreferences();
    startTransition(() => {
      setNotifications(saved.notifications);
      setPrefs({
        network: saved.network,
        currency: saved.currency,
        autoSignOut: saved.autoSignOut,
      });
    });
  }, []);

  function setNotif<K extends keyof AppPreferences["notifications"]>(
    key: K,
    value: AppPreferences["notifications"][K],
  ) {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  }

  function setPref<K extends "network" | "currency" | "autoSignOut">(
    key: K,
    value: AppPreferences[K],
  ) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setValidationErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validatePreferences(): boolean {
    const errors: ValidationErrors = {};

    if (!prefs.network) {
      errors.network = "Network selection is required";
    }

    if (!prefs.currency) {
      errors.currency = "Currency selection is required";
    }

    if (!prefs.autoSignOut) {
      errors.autoSignOut = "Auto sign-out preference is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCopyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSavePreferences() {
    if (!validatePreferences()) {
      return;
    }

    writePreferences({ ...prefs, notifications });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  function handleLanguageChange(next: string) {
    const nextLocale = next as Locale;
    // Apply instantly via the locale provider (no full page reload).
    setLocale(nextLocale);
    // Persist to both cookie and localStorage so the choice survives reloads.
    if (typeof document !== "undefined") {
      document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    }
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    } catch {
      // Ignore storage failures (e.g. private mode / quota).
    }
  }

  const walletStatus = isLoading
    ? "Checking…"
    : isAuthenticated
      ? "Authenticated"
      : isWalletConnected
        ? "Wallet linked — sign in to authenticate"
        : isWalletDetected
          ? "Freighter detected — permission required"
          : "Freighter not detected";

  return (
    <section className="min-h-full bg-bg-primary px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-text-primary">
            {t("settings.title", locale)}
          </h1>
          <p className="text-sm text-text-secondary">
            {t("settings.subtitle", locale)}
          </p>
        </header>

        <SectionCard
          title="Language"
          description="Choose the language used across the app."
        >
          <SelectField
            label="Language"
            description="Applies instantly and is saved to this device."
            value={locale}
            onChange={handleLanguageChange}
            options={LANGUAGE_OPTIONS}
          />
        </SectionCard>

        <SectionCard
          title="Appearance"
          description="Customize how the app looks."
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Theme</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Switch between light and dark mode.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </SectionCard>

        <SectionCard
          title="Notifications"
          description="Manage how you receive updates."
        >
          <Toggle
            checked={notifications.email}
            onChange={(v) => setNotif("email", v)}
            label="Email notifications"
            description="Receive updates about your trades by email."
          />
          <Divider />
          <Toggle
            checked={notifications.push}
            onChange={(v) => setNotif("push", v)}
            label="Push notifications"
            description="Receive push notifications in your browser."
          />
        </SectionCard>

        <SectionCard
          title="Preferences"
          description="Configure network and display preferences."
        >
          <SelectField
            label="Network"
            value={prefs.network}
            onChange={(v) => setPref("network", v as AppPreferences["network"])}
            options={[
              { value: "testnet", label: "Testnet" },
              { value: "mainnet", label: "Mainnet" },
            ]}
            error={validationErrors.network}
          />
          <Divider />
          <SelectField
            label="Currency"
            value={prefs.currency}
            onChange={(v) => setPref("currency", v as AppPreferences["currency"])}
            options={[
              { value: "USD", label: "USD" },
              { value: "NGN", label: "NGN" },
            ]}
            error={validationErrors.currency}
          />
          <Divider />
          <Toggle
            checked={prefs.autoSignOut}
            onChange={(v) => setPref("autoSignOut", v)}
            label="Auto sign-out"
            description="Automatically sign out after a period of inactivity."
          />
          <div className="flex items-center justify-end gap-3 pt-1">
            {saveSuccess && (
              <span className="text-xs text-status-success">Saved</span>
            )}
            <button
              type="button"
              onClick={handleSavePreferences}
              className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-bg-primary hover:opacity-90 transition-opacity"
            >
              Save preferences
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="Wallet"
          description="Manage your connected wallet."
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Status</p>
              <p className="text-xs text-text-secondary mt-0.5">{walletStatus}</p>
            </div>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-elevated transition-colors"
              >
                Sign out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => (isWalletConnected ? authenticate() : connectWallet())}
                className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-bg-primary hover:opacity-90 transition-opacity"
              >
                {isWalletConnected ? "Sign in" : "Connect wallet"}
              </button>
            )}
          </div>
          {address && (
            <>
              <Divider />
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-mono text-text-secondary break-all">
                  {address}
                </p>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="shrink-0 rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </>
          )}
        </SectionCard>
      </div>
    </section>
  );
}
