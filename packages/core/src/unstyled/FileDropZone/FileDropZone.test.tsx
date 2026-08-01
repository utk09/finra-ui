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

describe("FileDropZoneBase — consumer event handlers", () => {
  it("still receives dropped files when a consumer passes onDrop", async () => {
    const onChange = vi.fn();
    const onDrop = vi.fn();
    render(<FileDropZoneBase onChange={onChange} onDrop={onDrop} />);

    const file = createFile("report.csv", "text/csv");
    fireEvent.drop(screen.getByRole("button"), { dataTransfer: { files: [file] } });

    // A consumer handler must add to the drop zone's behaviour, never replace
    // it - a zone that stops accepting files the moment you observe the drop is
    // useless.
    expect(onDrop).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith([file]);
  });

  it("still opens the picker when a consumer passes onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { fileInput } = renderWithRef({ onClick });
    const click = vi.spyOn(fileInput, "click");

    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });

  it("still opens the picker on Enter when a consumer passes onKeyDown", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    const { fileInput } = renderWithRef({ onKeyDown });
    const click = vi.spyOn(fileInput, "click");

    screen.getByRole("button").focus();
    await user.keyboard("{Enter}");

    expect(onKeyDown).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });

  it("still tracks drag-over state when a consumer passes onDragOver", () => {
    const onDragOver = vi.fn();
    render(<FileDropZoneBase onDragOver={onDragOver} />);
    const zone = screen.getByRole("button");

    fireEvent.dragOver(zone);

    expect(onDragOver).toHaveBeenCalled();
    expect(zone).toHaveAttribute("data-drag-over", "true");
  });

  it("keeps working when a consumer calls preventDefault in a drag handler", () => {
    const onChange = vi.fn();
    render(
      <FileDropZoneBase
        onChange={onChange}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
        }}
      />,
    );
    const zone = screen.getByRole("button");
    const file = createFile("report.csv", "text/csv");

    // On dragover/drop, `preventDefault()` is the standard way to declare a
    // valid drop target, not a request to override. Reading it as an override
    // would break the zone for consumers writing textbook drag-and-drop code.
    fireEvent.dragOver(zone);
    expect(zone).toHaveAttribute("data-drag-over", "true");

    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(onChange).toHaveBeenCalledWith([file]);
    // The drop ends the drag, so the highlight goes with it.
    expect(zone).not.toHaveAttribute("data-drag-over");
  });

  it("lets a consumer suppress the file picker with preventDefault on click", async () => {
    const user = userEvent.setup();
    const { fileInput } = renderWithRef({
      onClick: (event) => {
        event.preventDefault();
      },
    });
    const click = vi.spyOn(fileInput, "click");

    await user.click(screen.getByRole("button"));

    // Click and keydown keep the conventional meaning of preventDefault.
    expect(click).not.toHaveBeenCalled();
  });
});
