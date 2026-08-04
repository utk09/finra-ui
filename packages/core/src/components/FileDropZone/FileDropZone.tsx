import { UploadIcon } from "@utk09/finra-ui-icons/react";
import { clsx } from "clsx";
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

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import { useFormField } from "../../hooks/useFormField";
import type { AriaInvalid } from "../../logic/formField";
import { mergeRefs } from "../../utils/mergeRefs";
import styles from "./FileDropZone.module.scss";

/**
 * Props for FileDropZone - a drag-and-drop target that is also a button.
 *
 * @remarks
 * Reachable by keyboard as well as pointer: Enter and Space open the file
 * picker, so dropping is never the only route. `accept` filters the picker's
 * dialog but is not a validation guarantee - a determined drop can still carry
 * anything, so re-check types in `onChange`.
 */
export interface FileDropZoneProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
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
  /**
   * Render the icon above the prompt. Defaults to the library's upload icon.
   *
   * @remarks
   * Ignored when `children` is supplied, since that replaces the zone's whole
   * default content. The surrounding slot keeps its id and `aria-hidden`, so an
   * override stays decorative and stays selectable.
   */
  renderIcon?: () => ReactNode;
}

/**
 * A drag-and-drop file target that is also keyboard-operable.
 *
 * @see {@link FileDropZoneProps}
 */
export const FileDropZone = forwardRef<HTMLInputElement, FileDropZoneProps>(
  (
    {
      className,
      onChange,
      accept,
      multiple,
      disabled,
      children,
      renderIcon,
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
          className={styles.input}
          accept={accept}
          multiple={multiple}
          disabled={isDisabled}
          onChange={handleInputChange}
          tabIndex={-1}
          aria-hidden="true"
          {...{ [FINRA_UI_ATTR]: componentIds.fileDropZoneInput }}
        />
        <div
          {...{ [FINRA_UI_ATTR]: componentIds.fileDropZone }}
          role="button"
          id={field.id}
          tabIndex={isDisabled ? -1 : 0}
          aria-disabled={isDisabled || undefined}
          aria-describedby={field["aria-describedby"]}
          className={clsx(
            styles.dropZone,
            isDragOver && styles.dragOver,
            isDisabled && styles.disabled,
            className,
          )}
          {...props}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}>
          {children ?? (
            <div
              className={styles.content}
              {...{ [FINRA_UI_ATTR]: componentIds.fileDropZoneContent }}>
              {/* The id sits on the slot, not on the icon, so it survives a
                  `renderIcon` override and stays a usable selector. */}
              <span
                className={styles.icon}
                aria-hidden="true"
                {...{ [FINRA_UI_ATTR]: componentIds.fileDropZoneIcon }}>
                {renderIcon ? renderIcon() : <UploadIcon />}
              </span>
              <span className={styles.text} {...{ [FINRA_UI_ATTR]: componentIds.fileDropZoneText }}>
                Drop files here or click to browse
              </span>
            </div>
          )}
        </div>
      </>
    );
  },
);

FileDropZone.displayName = "FileDropZone";
