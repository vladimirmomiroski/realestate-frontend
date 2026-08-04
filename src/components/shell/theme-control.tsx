"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useClientDictionary } from "@/i18n/client-context";

const themeValues = ["system", "light", "dark"] as const;

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function ThemeControl() {
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  const dictionary = useClientDictionary();
  const { setTheme, theme } = useTheme();
  const selectedTheme = themeValues.includes(
    theme as (typeof themeValues)[number]
  )
    ? theme
    : "system";

  return (
    <div
      role="group"
      aria-label={dictionary.theme.label}
      aria-busy={!mounted || undefined}
      className="border-border bg-surface flex rounded-lg border p-1"
    >
      {themeValues.map((value) => (
        <Button
          key={value}
          size="compact"
          variant={mounted && selectedTheme === value ? "primary" : "ghost"}
          disabled={!mounted}
          aria-pressed={mounted ? selectedTheme === value : undefined}
          onClick={() => setTheme(value)}
        >
          {dictionary.theme[value]}
        </Button>
      ))}
    </div>
  );
}
