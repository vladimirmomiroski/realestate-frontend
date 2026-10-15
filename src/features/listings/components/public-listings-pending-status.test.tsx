import { render, screen } from "@testing-library/react";
import { useFormStatus } from "react-dom";
import { useLinkStatus } from "next/link";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({ useLinkStatus: vi.fn() }));
vi.mock("react-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-dom")>()),
  useFormStatus: vi.fn(),
}));

import { en } from "@/i18n/dictionaries/en";
import { mk } from "@/i18n/dictionaries/mk";

import { PublicListingsFormStatus } from "./public-listings-form-status";
import { PublicListingsLinkStatus } from "./public-listings-link-status";

describe("catalog pending status presentation", () => {
  it.each([en, mk])(
    "renders form status only while the supported hook is pending",
    (dictionary) => {
      vi.mocked(useFormStatus).mockReturnValue({
        pending: false,
        data: null,
        method: null,
        action: null,
      });
      const { rerender, container } = render(
        <PublicListingsFormStatus
          label={dictionary.listings.navigationPending}
        />
      );
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      vi.mocked(useFormStatus).mockReturnValue({
        pending: true,
        data: new FormData(),
        method: "get",
        action: "/en/listings",
      });
      rerender(
        <PublicListingsFormStatus
          label={dictionary.listings.navigationPending}
        />
      );
      expect(screen.getAllByRole("status")).toHaveLength(1);
      expect(screen.getByRole("status")).toHaveTextContent(
        dictionary.listings.navigationPending
      );
      expect(container.querySelector("button, a, [tabindex]")).toBeNull();
      vi.mocked(useFormStatus).mockReturnValue({
        pending: false,
        data: null,
        method: null,
        action: null,
      });
      rerender(
        <PublicListingsFormStatus
          label={dictionary.listings.navigationPending}
        />
      );
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    }
  );

  it.each([en, mk])(
    "renders link status only while the supported hook is pending",
    (dictionary) => {
      vi.mocked(useLinkStatus).mockReturnValue({ pending: false });
      const { rerender, container } = render(
        <PublicListingsLinkStatus
          label={dictionary.listings.navigationPending}
        />
      );
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      vi.mocked(useLinkStatus).mockReturnValue({ pending: true });
      rerender(
        <PublicListingsLinkStatus
          label={dictionary.listings.navigationPending}
        />
      );
      expect(screen.getAllByRole("status")).toHaveLength(1);
      expect(screen.getByRole("status")).toHaveTextContent(
        dictionary.listings.navigationPending
      );
      expect(container.querySelector("button, a, [tabindex]")).toBeNull();
      vi.mocked(useLinkStatus).mockReturnValue({ pending: false });
      rerender(
        <PublicListingsLinkStatus
          label={dictionary.listings.navigationPending}
        />
      );
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    }
  );
});
