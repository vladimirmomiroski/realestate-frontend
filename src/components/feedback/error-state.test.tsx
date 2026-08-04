import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ErrorState } from "./error-state";

describe("ErrorState", () => {
  it("renders an accessible message without an absent request ID", () => {
    render(
      <ErrorState
        title="Something went wrong"
        description="Please try again."
      />
    );

    expect(screen.getByRole("alert")).toHaveAccessibleName(
      "Something went wrong"
    );
    expect(screen.queryByText("Support ID")).not.toBeInTheDocument();
  });

  it("presents a request ID when supplied", () => {
    render(
      <ErrorState
        title="Something went wrong"
        description="Please try again."
        requestId="request-123"
        requestIdLabel="Support ID"
      />
    );

    expect(screen.getByText("Support ID")).toBeInTheDocument();
    expect(screen.getByText("request-123")).toBeInTheDocument();
  });

  it("runs the optional retry action", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <ErrorState
        title="Something went wrong"
        description="Please try again."
        retryLabel="Try again"
        onRetry={onRetry}
      />
    );

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
