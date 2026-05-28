import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Avatar from "./Avatar";

describe("Avatar", () => {
  it("renders the first letter of username uppercased", () => {
    render(<Avatar username="alice" color="#6366f1" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("applies the background color via inline style", () => {
    render(<Avatar username="bob" color="#ec4899" />);
    expect(screen.getByTitle("bob")).toHaveStyle({ backgroundColor: "#ec4899" });
  });

  it("sets the title attribute to the full username", () => {
    render(<Avatar username="charlie" color="#fff" />);
    expect(screen.getByTitle("charlie")).toBeInTheDocument();
  });

  it("applies sm size classes", () => {
    const { container } = render(<Avatar username="x" color="#fff" size="sm" />);
    expect((container.firstChild as HTMLElement).className).toContain("h-6");
  });

  it("applies lg size classes", () => {
    const { container } = render(<Avatar username="x" color="#fff" size="lg" />);
    expect((container.firstChild as HTMLElement).className).toContain("h-10");
  });

  it("defaults to md size when size is not specified", () => {
    const { container } = render(<Avatar username="x" color="#fff" />);
    expect((container.firstChild as HTMLElement).className).toContain("h-8");
  });
});
