import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClientDictionaryProvider } from "@/i18n/client-context";
import { getClientDictionary } from "@/i18n/client-dictionary";
import { en } from "@/i18n/dictionaries/en";

import { ThemeControl } from "./theme-control";

const setTheme = vi.fn();
let activeTheme = "system";

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme, theme: activeTheme }),
}));

function renderThemeControl() {
  return render(
    <ClientDictionaryProvider dictionary={getClientDictionary(en)} locale="en">
      <ThemeControl />
    </ClientDictionaryProvider>
  );
}

describe("ThemeControl", () => {
  beforeEach(() => {
    activeTheme = "system";
  });

  it("offers System, Light, and Dark with an accurate selected state", () => {
    renderThemeControl();

    expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "System" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Light" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("uses native keyboard operation and calls next-themes", async () => {
    const user = userEvent.setup();
    renderThemeControl();

    const darkChoice = screen.getByRole("button", { name: "Dark" });
    darkChoice.focus();
    await user.keyboard("{Enter}");

    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("reflects a persisted explicit preference", () => {
    activeTheme = "light";
    renderThemeControl();

    expect(screen.getByRole("button", { name: "Light" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});
