import {
  type ChangeEvent,
  type DragEvent,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";

import { useFormField } from "../../hooks/useFormField";
import type { AriaInvalid } from "../../logic/formField";
import { mergeRefs } from "../../utils/mergeRefs";

/**
 * Props for the unstyled drop zone.
 *
 * @remarks
 * Reachable by keyboard as well as pointer: Enter and Space open the file
 * picker, so dropping is never the only route. `accept` filters the picker's
 * dialog but is not a validation guarantee - a drop can still carry anything,
 * so re-check types in `onChange`.
 */
export interface FileDropZoneBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Called with selected files. */
  onChange?: (files: File[]) => void;
  /** Accepted file types (e.g. ".pdf,.csv" or "image/*"). */
  accept?: string;
  /** Allow multiple file selection. */
  multiple?: boolean;
  /** Disable the component. */
  disabled?: boolean;
  /** Custom content inside the drop zone. */
  children?: ReactNode;
}

/**
 * Unstyled drop zone. Keyboard-operable as well as drag-and-drop.
 *
 * @see {@link FileDropZoneBaseProps}
 */
export const FileDropZoneBase = forwardRef<HTMLInputElement, FileDropZoneBaseProps>(
  (
    {
      onChange,
      accept,
      multiple,
      disabled,
      children,
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      // Pulled out of `props` and composed below. Left in, they would be
      // spread *over* this component's own handlers rather than alongside
      // them, so a consumer merely observing a drop would silently stop the
      // zone accepting files.
      onClick: onClickProp,
      onKeyDown: onKeyDownProp,
      onDragOver: onDragOverProp,
      onDragLeave: onDragLeaveProp,
      onDrop: onDropProp,
      ...props
    },
    forwardedRef,
  ) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const internalRef = useRef<HTMLInputElement>(null);

    // Wire the interactive drop target (the role="button" div) into an
    // enclosing FormField. `disabled` drives behaviour and aria-disabled - a
    // div can't take a real `disabled` attribute. No-op when standalone.
    const field = useFormField({
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid as AriaInvalid | undefined,
      disabled,
    });
    const isDisabled = field.disabled;

    const handleFiles = useCallback(
      (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;
        onChange?.(Array.from(fileList));
      },
      [onChange],
    );

    // Drag handlers deliberately do NOT gate on `defaultPrevented`.
    //
    // On `dragover` and `drop`, `preventDefault()` is the required idiom for
    // "this is a valid drop target" - every consumer following standard
    // drag-and-drop practice calls it. Treating it as an override signal, the
    // way `click` and `keydown` do, would break the zone for exactly the people
    // writing correct code. The consumer is notified first; this component's
    // own behaviour then always runs.
    const handleDragOver = useCallback(
      (e: DragEvent<HTMLDivElement>) => {
        onDragOverProp?.(e);
        e.preventDefault();
        if (!isDisabled) {
          setIsDragOver(true);
        }
      },
      [isDisabled, onDragOverProp],
    );

    const handleDragLeave = useCallback(
      (e: DragEvent<HTMLDivElement>) => {
        onDragLeaveProp?.(e);
        e.preventDefault();
        setIsDragOver(false);
      },
      [onDragLeaveProp],
    );

    const handleDrop = useCallback(
      (e: DragEvent<HTMLDivElement>) => {
        onDropProp?.(e);
        e.preventDefault();
        setIsDragOver(false);
        if (!isDisabled) {
          handleFiles(e.dataTransfer.files);
        }
      },
      [isDisabled, handleFiles, onDropProp],
    );

    const handleInputChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        // Reset so the same file can be selected again
        e.target.value = "";
      },
      [handleFiles],
    );

    // Click and keydown do gate on `defaultPrevented`: there it carries its
    // conventional meaning, so it is how a consumer suppresses the file picker
    // for a gesture it wants to own.
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        onClickProp?.(e);
        if (e.defaultPrevented || isDisabled) return;
        internalRef.current?.click();
      },
      [isDisabled, onClickProp],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDownProp?.(e);
        if (e.defaultPrevented || isDisabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          internalRef.current?.click();
        }
      },
      [isDisabled, onKeyDownProp],
    );

    return (
      <>
        <input
          ref={mergeRefs(forwardedRef, internalRef)}
          type="file"
          style={{ display: "none" }}
          accept={accept}
          multiple={multiple}
          disabled={isDisabled}
          onChange={handleInputChange}
          tabIndex={-1}
          aria-hidden="true"
        />
        <div
          role="button"
          id={field.id}
          tabIndex={isDisabled ? -1 : 0}
          aria-disabled={isDisabled || undefined}
          aria-describedby={field["aria-describedby"]}
          data-drag-over={isDragOver || undefined}
          {...props}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}>
          {children ?? <span>Drop files here or click to browse</span>}
        </div>
      </>
    );
  },
);

FileDropZoneBase.displayName = "FileDropZoneBase";
