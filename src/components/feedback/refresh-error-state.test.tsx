import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));

import { en } from "@/i18n/dictionaries/en";
import { mk } from "@/i18n/dictionaries/mk";

import { RefreshErrorState } from "./refresh-error-state";

function deferredCopy() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

for (const dictionary of [en, mk]) {
  describe(`${dictionary.errors.retry} feedback`, () => {
    const props = {
      title: dictionary.listings.failure.title,
      description: dictionary.listings.failure.server,
      labels: dictionary.errors,
    };
    it("refreshes only on explicit retry, without pushing a replacement URL", async () => {
      const user = userEvent.setup();
      render(<RefreshErrorState {...props} />);
      expect(screen.getAllByRole("alert")).toHaveLength(1);
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
        props.title
      );
      expect(
        screen.queryByRole("heading", { level: 1 })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(dictionary.errors.requestIdLabel)
      ).not.toBeInTheDocument();
      expect(refresh).not.toHaveBeenCalled();
      await user.click(
        screen.getByRole("button", { name: dictionary.errors.retry })
      );
      expect(refresh).toHaveBeenCalledExactlyOnceWith();
    });

    it("copies the exact readable ID and announces the result", async () => {
      const user = userEvent.setup();
      const write = vi
        .spyOn(navigator.clipboard, "writeText")
        .mockResolvedValue();
      render(<RefreshErrorState {...props} requestId="00-backend-id-01" />);
      expect(screen.getByText("00-backend-id-01")).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: dictionary.errors.copyRequestId })
      );
      expect(write).toHaveBeenCalledExactlyOnceWith("00-backend-id-01");
      expect(screen.getByRole("status")).toHaveTextContent(
        dictionary.errors.requestIdCopied
      );
      expect(refresh).not.toHaveBeenCalled();
    });

    it("keeps the ID readable when clipboard access fails", async () => {
      const user = userEvent.setup();
      vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
        new Error("Denied")
      );
      render(<RefreshErrorState {...props} requestId="backend-id" />);
      await user.click(
        screen.getByRole("button", { name: dictionary.errors.copyRequestId })
      );
      expect(screen.getByRole("status")).toHaveTextContent(
        dictionary.errors.requestIdCopyFailed
      );
      expect(screen.getByText("backend-id")).toBeInTheDocument();
    });

    it("removes feedback for A when B is displayed and allows copying B", async () => {
      const user = userEvent.setup();
      const write = vi
        .spyOn(navigator.clipboard, "writeText")
        .mockResolvedValue();
      const { rerender } = render(
        <RefreshErrorState {...props} requestId="id-A" />
      );
      await user.click(
        screen.getByRole("button", { name: dictionary.errors.copyRequestId })
      );
      expect(screen.getByRole("status")).toHaveTextContent(
        dictionary.errors.requestIdCopied
      );

      rerender(<RefreshErrorState {...props} requestId="id-B" />);
      expect(screen.getByText("id-B")).toBeInTheDocument();
      expect(screen.queryByText("id-A")).not.toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: dictionary.errors.copyRequestId })
      );
      expect(write.mock.calls).toEqual([["id-A"], ["id-B"]]);
      expect(screen.getByRole("status")).toHaveTextContent(
        dictionary.errors.requestIdCopied
      );
    });

    it("removes copy feedback and controls when the ID disappears", async () => {
      const user = userEvent.setup();
      vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
      const { rerender } = render(
        <RefreshErrorState {...props} requestId="id-A" />
      );
      await user.click(
        screen.getByRole("button", { name: dictionary.errors.copyRequestId })
      );
      expect(screen.getByRole("status")).toHaveTextContent(
        dictionary.errors.requestIdCopied
      );

      rerender(<RefreshErrorState {...props} />);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.queryByText("id-A")).not.toBeInTheDocument();
      expect(
        screen.queryByText(dictionary.errors.requestIdLabel)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: dictionary.errors.copyRequestId })
      ).not.toBeInTheDocument();
    });

    it.each(["resolve", "reject"] as const)(
      "ignores a late %s for A after B is displayed",
      async (settlement) => {
        const user = userEvent.setup();
        let resolve!: () => void;
        let reject!: (error: Error) => void;
        const pending = new Promise<void>((onResolve, onReject) => {
          resolve = onResolve;
          reject = onReject;
        });
        const write = vi
          .spyOn(navigator.clipboard, "writeText")
          .mockReturnValueOnce(pending)
          .mockResolvedValue(undefined);
        const { rerender } = render(
          <RefreshErrorState {...props} requestId="id-A" />
        );
        await user.click(
          screen.getByRole("button", { name: dictionary.errors.copyRequestId })
        );
        rerender(<RefreshErrorState {...props} requestId="id-B" />);

        await act(async () => {
          if (settlement === "resolve") resolve();
          else reject(new Error("Late failure for A"));
          await pending.catch(() => {});
        });
        expect(screen.getByText("id-B")).toBeInTheDocument();
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
        await user.click(
          screen.getByRole("button", { name: dictionary.errors.copyRequestId })
        );
        expect(write).toHaveBeenLastCalledWith("id-B");
        expect(screen.getByRole("status")).toHaveTextContent(
          dictionary.errors.requestIdCopied
        );
      }
    );

    it("keeps repeated copies of the same ID working, including after a failed copy", async () => {
      const user = userEvent.setup();
      const write = vi
        .spyOn(navigator.clipboard, "writeText")
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error("Denied"))
        .mockResolvedValueOnce();
      render(<RefreshErrorState {...props} requestId="id-B" />);
      const copy = screen.getByRole("button", {
        name: dictionary.errors.copyRequestId,
      });
      await user.click(copy);
      expect(screen.getByRole("status")).toHaveTextContent(
        dictionary.errors.requestIdCopied
      );
      await user.click(copy);
      expect(screen.getByRole("status")).toHaveTextContent(
        dictionary.errors.requestIdCopyFailed
      );
      expect(
        screen.queryByText(dictionary.errors.requestIdCopied)
      ).not.toBeInTheDocument();
      await user.click(copy);
      expect(screen.getByRole("status")).toHaveTextContent(
        dictionary.errors.requestIdCopied
      );
      expect(write.mock.calls).toEqual([["id-B"], ["id-B"], ["id-B"]]);
    });

    it.each([true, false])(
      "keeps the latest same-ID result when an older opposite result arrives (success=%s)",
      async (latestSucceeded) => {
        const user = userEvent.setup();
        const first = deferredCopy();
        const second = deferredCopy();
        const write = vi
          .spyOn(navigator.clipboard, "writeText")
          .mockReturnValueOnce(first.promise)
          .mockReturnValueOnce(second.promise);
        render(<RefreshErrorState {...props} requestId="id-A" />);
        const copy = screen.getByRole("button", {
          name: dictionary.errors.copyRequestId,
        });
        await user.click(copy);
        await user.click(copy);
        expect(write.mock.calls).toEqual([["id-A"], ["id-A"]]);

        await act(async () => {
          if (latestSucceeded) second.resolve();
          else second.reject(new Error("Latest copy failed"));
          await second.promise.catch(() => {});
        });
        const message = latestSucceeded
          ? dictionary.errors.requestIdCopied
          : dictionary.errors.requestIdCopyFailed;
        expect(screen.getByRole("status")).toHaveTextContent(message);

        await act(async () => {
          if (latestSucceeded)
            first.reject(new Error("Superseded copy failed"));
          else first.resolve();
          await first.promise.catch(() => {});
        });
        expect(screen.getByRole("status")).toHaveTextContent(message);
      }
    );

    it.each([true, false])(
      "ignores older same-ID completion while the latest copy is pending (success=%s)",
      async (olderSucceeded) => {
        const user = userEvent.setup();
        const first = deferredCopy();
        const second = deferredCopy();
        vi.spyOn(navigator.clipboard, "writeText")
          .mockReturnValueOnce(first.promise)
          .mockReturnValueOnce(second.promise);
        render(<RefreshErrorState {...props} requestId="id-A" />);
        const copy = screen.getByRole("button", {
          name: dictionary.errors.copyRequestId,
        });
        await user.click(copy);
        await user.click(copy);

        await act(async () => {
          if (olderSucceeded) first.resolve();
          else first.reject(new Error("Superseded copy failed"));
          await first.promise.catch(() => {});
        });
        expect(screen.queryByRole("status")).not.toBeInTheDocument();

        await act(async () => {
          if (olderSucceeded) second.reject(new Error("Latest copy failed"));
          else second.resolve();
          await second.promise.catch(() => {});
        });
        expect(screen.getByRole("status")).toHaveTextContent(
          olderSucceeded
            ? dictionary.errors.requestIdCopyFailed
            : dictionary.errors.requestIdCopied
        );
      }
    );

    it.each(["synchronous failure", "unavailable API"] as const)(
      "reports clipboard %s without claiming success",
      async (failure) => {
        const user = userEvent.setup();
        if (failure === "synchronous failure") {
          vi.spyOn(navigator.clipboard, "writeText").mockImplementation(() => {
            throw new Error("Denied synchronously");
          });
        } else {
          vi.spyOn(navigator, "clipboard", "get").mockReturnValue(
            undefined as unknown as Clipboard
          );
        }
        render(<RefreshErrorState {...props} requestId="id-A" />);
        await user.click(
          screen.getByRole("button", { name: dictionary.errors.copyRequestId })
        );
        expect(screen.getByRole("status")).toHaveTextContent(
          dictionary.errors.requestIdCopyFailed
        );
        expect(
          screen.queryByText(dictionary.errors.requestIdCopied)
        ).not.toBeInTheDocument();
        expect(screen.getByText("id-A")).toBeInTheDocument();
      }
    );

    it("server-renders ordinary same-URL navigation and readable support information", () => {
      const html = renderToStaticMarkup(
        <RefreshErrorState {...props} requestId="backend-id" />
      );
      const document = new DOMParser().parseFromString(html, "text/html");
      expect(document.querySelector("a")?.getAttribute("href")).toBe("");
      expect(document.querySelector("a")?.textContent).toBe(
        dictionary.errors.retry
      );
      expect(document.body.textContent).toContain("backend-id");
      expect(document.querySelector("button")).toBeNull();
    });
  });
}
