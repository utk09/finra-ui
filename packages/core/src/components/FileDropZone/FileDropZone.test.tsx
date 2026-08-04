import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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
    render(<FileDropZone aria-label="Upload" />);
    expect(screen.getByTestId("file-drop-zone")).toBeInTheDocument();
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
    const fileInput = screen.getByTestId("file-drop-zone-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    await user.click(zone);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("opens file dialog on Enter key", () => {
    render(<FileDropZone aria-label="Upload" />);

    const zone = screen.getByRole("button");
    const fileInput = screen.getByTestId("file-drop-zone-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    fireEvent.keyDown(zone, { key: "Enter" });
    expect(clickSpy).toHaveBeenCalled();
  });

  it("opens file dialog on Space key", () => {
    render(<FileDropZone aria-label="Upload" />);

    const zone = screen.getByRole("button");
    const fileInput = screen.getByTestId("file-drop-zone-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    fireEvent.keyDown(zone, { key: " " });
    expect(clickSpy).toHaveBeenCalled();
  });

  it("calls onChange when files are selected via input", () => {
    const handleChange = vi.fn();
    render(<FileDropZone aria-label="Upload" onChange={handleChange} />);

    const fileInput = screen.getByTestId("file-drop-zone-input") as HTMLInputElement;
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
    render(<FileDropZone aria-label="Upload" />);
    const zone = screen.getByRole("button");

    fireEvent.dragOver(zone, { dataTransfer: { files: [] } });

    const wrapper = screen.getByTestId("file-drop-zone");
    expect(wrapper.className).toMatch(/dragOver/);
  });

  it("removes dragOver class on drag leave", () => {
    render(<FileDropZone aria-label="Upload" />);
    const zone = screen.getByRole("button");

    fireEvent.dragOver(zone, { dataTransfer: { files: [] } });
    fireEvent.dragLeave(zone, { dataTransfer: { files: [] } });

    const wrapper = screen.getByTestId("file-drop-zone");
    expect(wrapper.className).not.toMatch(/dragOver/);
  });

  it("applies disabled state", () => {
    render(<FileDropZone aria-label="Upload" disabled />);
    const zone = screen.getByRole("button");
    expect(zone).toHaveAttribute("aria-disabled", "true");
    expect(zone).toHaveAttribute("tabindex", "-1");
    const wrapper = screen.getByTestId("file-drop-zone");
    expect(wrapper.className).toMatch(/disabled/);
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
    const fileInput = screen.getByTestId("file-drop-zone-input") as HTMLInputElement;
    expect(fileInput).toHaveAttribute("accept", ".pdf,.csv");
  });

  it("passes multiple to file input", () => {
    render(<FileDropZone aria-label="Upload" multiple />);
    const fileInput = screen.getByTestId("file-drop-zone-input") as HTMLInputElement;
    expect(fileInput).toHaveAttribute("multiple");
  });

  it("applies custom className", () => {
    render(<FileDropZone aria-label="Upload" className="my-class" />);
    const wrapper = screen.getByTestId("file-drop-zone");
    expect(wrapper.className).toContain("my-class");
  });

  it("does not open file dialog when disabled and clicked", async () => {
    const user = userEvent.setup();
    render(<FileDropZone aria-label="Upload" disabled />);

    const zone = screen.getByRole("button");
    const fileInput = screen.getByTestId("file-drop-zone-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    await user.click(zone);
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("does not set dragOver when disabled", () => {
    render(<FileDropZone aria-label="Upload" disabled />);
    const zone = screen.getByRole("button");

    fireEvent.dragOver(zone, { dataTransfer: { files: [] } });

    const wrapper = screen.getByTestId("file-drop-zone");
    expect(wrapper.className).not.toMatch(/dragOver/);
  });

  it("resets input value after file selection", () => {
    render(<FileDropZone aria-label="Upload" onChange={vi.fn()} />);
    const fileInput = screen.getByTestId("file-drop-zone-input") as HTMLInputElement;
    const file = createFile("test.txt", "text/plain");

    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(fileInput.value).toBe("");
  });

  it("does not call onChange when no files in drop", () => {
    const handleChange = vi.fn();
    render(<FileDropZone aria-label="Upload" onChange={handleChange} />);
    const zone = screen.getByRole("button");

    fireEvent.drop(zone, { dataTransfer: { files: [] } });
    expect(handleChange).not.toHaveBeenCalled();
  });
});

describe("FileDropZone - consumer event handlers", () => {
  it("still receives dropped files when a consumer passes onDrop", () => {
    const onChange = vi.fn();
    const onDrop = vi.fn();
    render(<FileDropZone aria-label="Upload" onChange={onChange} onDrop={onDrop} />);

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
    render(<FileDropZone aria-label="Upload" onClick={onClick} />);
    const fileInput = screen.getByTestId("file-drop-zone-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });

  it("still opens the picker on Enter when a consumer passes onKeyDown", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(<FileDropZone aria-label="Upload" onKeyDown={onKeyDown} />);
    const fileInput = screen.getByTestId("file-drop-zone-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    screen.getByRole("button").focus();
    await user.keyboard("{Enter}");

    expect(onKeyDown).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });

  it("still tracks drag-over state when a consumer passes onDragOver", () => {
    const onDragOver = vi.fn();
    render(<FileDropZone aria-label="Upload" onDragOver={onDragOver} />);

    fireEvent.dragOver(screen.getByRole("button"));

    expect(onDragOver).toHaveBeenCalled();
    expect(screen.getByTestId("file-drop-zone").className).toMatch(/dragOver/);
  });

  it("still clears drag-over state when a consumer passes onDragLeave", () => {
    const onDragLeave = vi.fn();
    render(<FileDropZone aria-label="Upload" onDragLeave={onDragLeave} />);
    const zone = screen.getByRole("button");

    fireEvent.dragOver(zone);
    fireEvent.dragLeave(zone);

    expect(onDragLeave).toHaveBeenCalled();
    expect(screen.getByTestId("file-drop-zone").className).not.toMatch(/dragOver/);
  });

  it("keeps working when a consumer calls preventDefault in a drag handler", () => {
    const onChange = vi.fn();
    render(
      <FileDropZone
        aria-label="Upload"
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
    expect(screen.getByTestId("file-drop-zone").className).toMatch(/dragOver/);

    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(onChange).toHaveBeenCalledWith([file]);
    // The drop ends the drag, so the highlight goes with it.
    expect(screen.getByTestId("file-drop-zone").className).not.toMatch(/dragOver/);
  });

  it("lets a consumer suppress the file picker with preventDefault on click", async () => {
    const user = userEvent.setup();
    render(
      <FileDropZone
        aria-label="Upload"
        onClick={(event) => {
          event.preventDefault();
        }}
      />,
    );
    const fileInput = screen.getByTestId("file-drop-zone-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    await user.click(screen.getByRole("button"));

    // Click and keydown keep the conventional meaning of preventDefault.
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("lets a consumer suppress the file picker with preventDefault on keydown", async () => {
    const user = userEvent.setup();
    render(
      <FileDropZone
        aria-label="Upload"
        onKeyDown={(event) => {
          event.preventDefault();
        }}
      />,
    );
    const fileInput = screen.getByTestId("file-drop-zone-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    screen.getByRole("button").focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("does not open the picker from the keyboard while disabled", () => {
    const onKeyDown = vi.fn();
    render(<FileDropZone aria-label="Upload" disabled onKeyDown={onKeyDown} />);
    const fileInput = screen.getByTestId("file-drop-zone-input") as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });

    // The consumer still hears the key - only the component's own reaction is
    // suppressed, so a disabled zone can still be instrumented.
    expect(onKeyDown).toHaveBeenCalled();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("renders the upload icon by default", () => {
    render(<FileDropZone />);
    expect(screen.getByTestId("file-drop-zone-icon").innerHTML).toContain("<svg");
  });

  it("lets a consumer override the icon", () => {
    render(<FileDropZone renderIcon={() => <span>mine</span>} />);
    expect(screen.getByTestId("file-drop-zone-icon")).toHaveTextContent("mine");
  });

  it("keeps the icon slot's id and hides it from assistive tech when overridden", () => {
    render(<FileDropZone renderIcon={() => <span>mine</span>} />);
    // The id has to survive an override, or the selector is a claim rather than
    // a contract.
    expect(screen.getByTestId("file-drop-zone-icon")).toHaveAttribute("aria-hidden", "true");
  });
});
