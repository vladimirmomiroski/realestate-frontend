import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    sizes,
    className,
    onError,
  }: {
    src: string;
    alt: string;
    sizes: string;
    className: string;
    onError: () => void;
  }) =>
    createElement("img", {
      src,
      alt,
      "data-sizes": sizes,
      className,
      onError,
    }),
}));

import { PublicListingMedia } from "./public-listing-media";

const src = "https://media.example.com/uploads/listings/preview.png";
const label = "Image unavailable";

describe("PublicListingMedia", () => {
  it("renders a redundant preview through Next Image in a fixed frame", () => {
    const { container } = render(
      <PublicListingMedia src={src} unavailableLabel={label} />
    );

    const image = screen.getByAltText("");
    expect(image).toHaveAttribute("src", src);
    expect(image).toHaveAttribute(
      "data-sizes",
      "(max-width: 639px) 90vw, 224px"
    );
    expect(image).toHaveClass("object-cover");
    expect(image.parentElement).toHaveClass("aspect-[4/3]");
    expect(container).not.toHaveTextContent(label);
  });

  it("shows localized fallback immediately when there is no resolved URL", () => {
    const { container } = render(
      <PublicListingMedia src={null} unavailableLabel="Сликата не е достапна" />
    );

    expect(screen.getByText("Сликата не е достапна")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Сликата не е достапна").parentElement).toHaveClass(
      "aspect-[4/3]"
    );
  });

  it("replaces a failed image without retrying the same URL or changing its frame", () => {
    const { container, rerender } = render(
      <PublicListingMedia src={src} unavailableLabel={label} />
    );
    const frame = screen.getByAltText("").parentElement;

    fireEvent.error(screen.getByAltText(""));
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(label).parentElement).toBe(frame);

    rerender(<PublicListingMedia src={src} unavailableLabel={label} />);
    expect(container.querySelector("img")).toBeNull();

    rerender(
      <PublicListingMedia
        src="https://media.example.com/uploads/listings/new.png"
        unavailableLabel={label}
      />
    );
    expect(screen.getByAltText("")).toHaveAttribute(
      "src",
      "https://media.example.com/uploads/listings/new.png"
    );
  });
});
