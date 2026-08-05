import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("defaults to a non-submitting button", () => {
    render(<Button>Open</Button>);

    expect(screen.getByRole("button", { name: "Open" })).toHaveAttribute(
      "type",
      "button"
    );
  });

  it("allows an explicit submit type", () => {
    render(<Button type="submit">Submit</Button>);

    expect(screen.getByRole("button", { name: "Submit" })).toHaveAttribute(
      "type",
      "submit"
    );
  });

  it("preserves native disabled behavior", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>
    );

    const button = screen.getByRole("button", { name: "Disabled" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is keyboard focusable and retains a visible-focus class", async () => {
    const user = userEvent.setup();
    render(<Button>Focusable</Button>);

    await user.tab();

    const button = screen.getByRole("button", { name: "Focusable" });
    expect(button).toHaveFocus();
    expect(button).toHaveClass("focus-visible:outline-focus-ring");
  });
});
