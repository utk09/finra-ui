import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileDropZone } from "./FileDropZone";

function createFile(name: string, type: string): File {
  return new File(["content"], name, { type });
}

describe("FileDropZone", () => {
  it("renders with default content", () => {
    render(<FileDropZone aria-label="Upload" />);
    expect(screen.getByText("Drop files here or click to browse")).toBeInTheDocument();
  });

  it('has data-finra-ui="file-drop-zone" attribute', () => {
    const { container } = render(<FileDropZone aria-label="Upload" />);
    expect(container.querySelector('[data-finra-ui="file-drop-zone"]')).toBeInTheDocument();
  });

  it("forwards ref to file input", () => {
    const ref = vi.fn();
    render(<FileDropZone ref={ref} aria-label="Upload" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("renders custom children", () => {
    render(
      <FileDropZone aria-label="Upload">
        <span>Custom content</span>
      </FileDropZone>,
    );
    expect(screen.getByText("Custom content")).toBeInTheDocument();
    expect(screen.queryByText("Drop files here or click to browse")).not.toBeInTheDocument();
  });

  it("has button role", () => {
    render(<FileDropZone aria-label="Upload" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("is focusable", () => {
    render(<FileDropZone aria-label="Upload" />);
    const zone = screen.getByRole("button");
    expect(zone).toHaveAttribute("tabindex", "0");
  });

  it("opens file dialog on click", async () => {
    const user = userEvent.setup();
    render(<FileDropZone aria-label="Upload" />);

    const zone = screen.getByRole("button");
    const fileInput = zone.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    await user.click(zone);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("opens file dialog on Enter key", () => {
    render(<FileDropZone aria-label="Upload" />);

    const zone = screen.getByRole("button");
    const fileInput = zone.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    fireEvent.keyDown(zone, { key: "Enter" });
    expect(clickSpy).toHaveBeenCalled();
  });

  it("opens file dialog on Space key", () => {
    render(<FileDropZone aria-label="Upload" />);

    const zone = screen.getByRole("button");
    const fileInput = zone.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    fireEvent.keyDown(zone, { key: " " });
    expect(clickSpy).toHaveBeenCalled();
  });

  it("calls onChange when files are selected via input", () => {
    const handleChange = vi.fn();
    render(<FileDropZone aria-label="Upload" onChange={handleChange} />);

    const zone = screen.getByRole("button");
    const fileInput = zone.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createFile("test.pdf", "application/pdf");

    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(handleChange).toHaveBeenCalledWith([file]);
  });

  it("calls onChange on file drop", () => {
    const handleChange = vi.fn();
    render(<FileDropZone aria-label="Upload" onChange={handleChange} />);

    const zone = screen.getByRole("button");
    const file = createFile("test.csv", "text/csv");

    fireEvent.drop(zone, {
      dataTransfer: { files: [file] },
    });
    expect(handleChange).toHaveBeenCalledWith([file]);
  });

  it("adds dragOver class on drag over", () => {
    const { container } = render(<FileDropZone aria-label="Upload" />);
    const zone = screen.getByRole("button");

    fireEvent.dragOver(zone, { dataTransfer: { files: [] } });

    const wrapper = container.querySelector('[data-finra-ui="file-drop-zone"]');
    expect(wrapper?.className).toMatch(/dragOver/);
  });

  it("removes dragOver class on drag leave", () => {
    const { container } = render(<FileDropZone aria-label="Upload" />);
    const zone = screen.getByRole("button");

    fireEvent.dragOver(zone, { dataTransfer: { files: [] } });
    fireEvent.dragLeave(zone, { dataTransfer: { files: [] } });

    const wrapper = container.querySelector('[data-finra-ui="file-drop-zone"]');
    expect(wrapper?.className).not.toMatch(/dragOver/);
  });

  it("applies disabled state", () => {
    const { container } = render(<FileDropZone aria-label="Upload" disabled />);
    const zone = screen.getByRole("button");
    expect(zone).toHaveAttribute("aria-disabled", "true");
    expect(zone).toHaveAttribute("tabindex", "-1");
    const wrapper = container.querySelector('[data-finra-ui="file-drop-zone"]');
    expect(wrapper?.className).toMatch(/disabled/);
  });

  it("does not call onChange when disabled and files are dropped", () => {
    const handleChange = vi.fn();
    render(<FileDropZone aria-label="Upload" disabled onChange={handleChange} />);

    const zone = screen.getByRole("button");
    const file = createFile("test.pdf", "application/pdf");

    fireEvent.drop(zone, {
      dataTransfer: { files: [file] },
    });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("passes accept to file input", () => {
    render(<FileDropZone aria-label="Upload" accept=".pdf,.csv" />);
    const zone = screen.getByRole("button");
    const fileInput = zone.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toHaveAttribute("accept", ".pdf,.csv");
  });

  it("passes multiple to file input", () => {
    render(<FileDropZone aria-label="Upload" multiple />);
    const zone = screen.getByRole("button");
    const fileInput = zone.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toHaveAttribute("multiple");
  });

  it("applies custom className", () => {
    const { container } = render(<FileDropZone aria-label="Upload" className="my-class" />);
    const wrapper = container.querySelector('[data-finra-ui="file-drop-zone"]');
    expect(wrapper?.className).toContain("my-class");
  });
});
