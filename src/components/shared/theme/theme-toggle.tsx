"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function useIsMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function ThemeToggle() {
  const mounted = useIsMounted();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        aria-label="Toggle theme"
        className="**:border-border bg-card h-10 w-20 cursor-not-allowed rounded-full border opacity-60"
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group border-border bg-card hover:bg-muted focus-visible:ring-ring relative inline-flex h-10 w-20 cursor-pointer items-center rounded-full border p-1 shadow-sm transition-all duration-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
    >
      <span
        className={`absolute left-3 transition-all duration-300 ${
          isDark
            ? "text-muted-foreground scale-90 opacity-50"
            : "text-warning scale-100 opacity-100"
        }`}
      >
        <Sun className="h-4 w-4" aria-hidden="true" />
      </span>

      <span
        className={`absolute right-3 transition-all duration-300 ${
          isDark
            ? "text-accent scale-100 opacity-100"
            : "text-muted-foreground scale-90 opacity-50"
        }`}
      >
        <Moon className="h-4 w-4" aria-hidden="true" />
      </span>

      <span
        className={`bg-primary text-primary-foreground relative z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-all duration-300 ease-out group-hover:shadow-md ${
          isDark ? "translate-x-10 rotate-12" : "translate-x-0 rotate-0"
        }`}
      >
        {isDark ? (
          <Moon
            className="h-4 w-4 transition-transform duration-300"
            aria-hidden="true"
          />
        ) : (
          <Sun
            className="h-4 w-4 transition-transform duration-300"
            aria-hidden="true"
          />
        )}
      </span>
    </button>
  );
}
