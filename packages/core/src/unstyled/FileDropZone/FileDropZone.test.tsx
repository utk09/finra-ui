import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { FileDropZoneBase } from "./FileDropZone";

function createFile(name: string, type: string): File {
  return new File(["content"], name, { type });
}

function renderWithRef(props: React.ComponentProps<typeof FileDropZoneBase> = {}) {
  const ref = createRef<HTMLInputElement>();
  const view = render(<FileDropZoneBase ref={ref} {...props} />);
  const fileInput = ref.current as HTMLInputElement;
  return { ...view, fileInput };
}

describe("FileDropZoneBase", () => {
  it("renders default content when no children", () => {
    render(<FileDropZoneBase />);
    expect(screen.getByText("Drop files here or click to browse")).toBeInTheDocument();
  });

  it("renders custom children", () => {
    render(
      <FileDropZoneBase>
        <span>Upload here</span>
      </FileDropZoneBase>,
    );
    expect(screen.getByText("Upload here")).toBeInTheDocument();
  });

  it("has button role", () => {
    render(<FileDropZoneBase />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("forwards ref to file input", () => {
    const ref = vi.fn();
    render(<FileDropZoneBase ref={ref} />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it("opens file dialog on click", async () => {
    const user = userEvent.setup();
    const { fileInput } = renderWithRef();

    const zone = screen.getByRole("button");
    const clickSpy = vi.spyOn(fileInput, "click");

    await user.click(zone);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("opens file dialog on Enter key", () => {
    const { fileInput } = renderWithRef();

    const zone = screen.getByRole("button");
    const clickSpy = vi.spyOn(fileInput, "click");

    fireEvent.keyDown(zone, { key: "Enter" });
    expect(clickSpy).toHaveBeenCalled();
  });

  it("opens file dialog on Space key", () => {
    const { fileInput } = renderWithRef();

    const zone = screen.getByRole("button");
    const clickSpy = vi.spyOn(fileInput, "click");

    fireEvent.keyDown(zone, { key: " " });
    expect(clickSpy).toHaveBeenCalled();
  });

  it("calls onChange when files are selected via input", () => {
    const handleChange = vi.fn();
    const { fileInput } = renderWithRef({ onChange: handleChange });

    const file = createFile("test.pdf", "application/pdf");
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(handleChange).toHaveBeenCalledWith([file]);
  });

  it("calls onChange on file drop", () => {
    const handleChange = vi.fn();
    render(<FileDropZoneBase onChange={handleChange} />);

    const zone = screen.getByRole("button");
    const file = createFile("test.csv", "text/csv");

    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(handleChange).toHaveBeenCalledWith([file]);
  });

  it("sets data-drag-over on drag over", () => {
    render(<FileDropZoneBase />);
    const zone = screen.getByRole("button");

    fireEvent.dragOver(zone, { dataTransfer: { files: [] } });
    expect(zone).toHaveAttribute("data-drag-over", "true");
  });

  it("removes data-drag-over on drag leave", () => {
    render(<FileDropZoneBase />);
    const zone = screen.getByRole("button");

    fireEvent.dragOver(zone, { dataTransfer: { files: [] } });
    fireEvent.dragLeave(zone, { dataTransfer: { files: [] } });
    expect(zone).not.toHaveAttribute("data-drag-over");
  });

  it("does not open file dialog when disabled", async () => {
    const user = userEvent.setup();
    const { fileInput } = renderWithRef({ disabled: true });

    const zone = screen.getByRole("button");
    const clickSpy = vi.spyOn(fileInput, "click");

    await user.click(zone);
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("does not set data-drag-over when disabled", () => {
    render(<FileDropZoneBase disabled />);
    const zone = screen.getByRole("button");

    fireEvent.dragOver(zone, { dataTransfer: { files: [] } });
    expect(zone).not.toHaveAttribute("data-drag-over");
  });

  it("does not call onChange when disabled and files dropped", () => {
    const handleChange = vi.fn();
    render(<FileDropZoneBase disabled onChange={handleChange} />);

    const zone = screen.getByRole("button");
    const file = createFile("test.pdf", "application/pdf");

    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("applies disabled attributes", () => {
    render(<FileDropZoneBase disabled />);
    const zone = screen.getByRole("button");
    expect(zone).toHaveAttribute("aria-disabled", "true");
    expect(zone).toHaveAttribute("tabindex", "-1");
  });

  it("passes accept to file input", () => {
    const { fileInput } = renderWithRef({ accept: ".pdf,.csv" });
    expect(fileInput).toHaveAttribute("accept", ".pdf,.csv");
  });

  it("passes multiple to file input", () => {
    const { fileInput } = renderWithRef({ multiple: true });
    expect(fileInput).toHaveAttribute("multiple");
  });

  it("resets input value after file selection", () => {
    const { fileInput } = renderWithRef({ onChange: vi.fn() });
    const file = createFile("test.txt", "text/plain");

    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(fileInput.value).toBe("");
  });

  it("does not call onChange when no files in drop", () => {
    const handleChange = vi.fn();
    render(<FileDropZoneBase onChange={handleChange} />);

    const zone = screen.getByRole("button");
    fireEvent.drop(zone, { dataTransfer: { files: [] } });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("does not call onChange when drop has null files", () => {
    const handleChange = vi.fn();
    const { fileInput } = renderWithRef({ onChange: handleChange });

    fireEvent.change(fileInput, { target: { files: null } });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("does not open file dialog on keydown when disabled", () => {
    const { fileInput } = renderWithRef({ disabled: true });

    const zone = screen.getByRole("button");
    const clickSpy = vi.spyOn(fileInput, "click");

    fireEvent.keyDown(zone, { key: "Enter" });
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
