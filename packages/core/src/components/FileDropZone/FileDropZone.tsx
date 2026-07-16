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

import { useFormField } from "../../hooks/useFormField";
import type { AriaInvalid } from "../../logic/formField";
import { mergeRefs } from "../../utils/mergeRefs";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./FileDropZone.module.scss";

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
}

export const FileDropZone = forwardRef<HTMLInputElement, FileDropZoneProps>(
  (
    {
      className,
      onChange,
      accept,
      multiple,
      disabled,
      children,
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
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

    const handleDragOver = useCallback(
      (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!isDisabled) {
          setIsDragOver(true);
        }
      },
      [isDisabled],
    );

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
      (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (!isDisabled) {
          handleFiles(e.dataTransfer.files);
        }
      },
      [isDisabled, handleFiles],
    );

    const handleInputChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        // Reset so the same file can be selected again
        e.target.value = "";
      },
      [handleFiles],
    );

    const handleClick = useCallback(() => {
      if (!isDisabled) {
        internalRef.current?.click();
      }
    }, [isDisabled]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!isDisabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          internalRef.current?.click();
        }
      },
      [isDisabled],
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
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          {...props}>
          {children ?? (
            <div className={styles.content}>
              <UploadIcon className={styles.icon} aria-hidden="true" />
              <span className={styles.text}>Drop files here or click to browse</span>
            </div>
          )}
        </div>
      </>
    );
  },
);

FileDropZone.displayName = "FileDropZone";
