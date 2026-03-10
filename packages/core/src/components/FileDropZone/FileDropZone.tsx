import {
  forwardRef,
  useState,
  useRef,
  useCallback,
  type DragEvent,
  type ChangeEvent,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { clsx } from "clsx";
import { mergeRefs } from "../../utils/mergeRefs";
import { UploadIcon } from "../../assets/icons";
import { FINRA_UI_ATTR, componentIds } from "../componentIds";
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
  ({ className, onChange, accept, multiple, disabled, children, ...props }, forwardedRef) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const internalRef = useRef<HTMLInputElement>(null);

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
        if (!disabled) {
          setIsDragOver(true);
        }
      },
      [disabled],
    );

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
      (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (!disabled) {
          handleFiles(e.dataTransfer.files);
        }
      },
      [disabled, handleFiles],
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
      if (!disabled) {
        internalRef.current?.click();
      }
    }, [disabled]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          internalRef.current?.click();
        }
      },
      [disabled],
    );

    return (
      <>
        <input
          ref={mergeRefs(forwardedRef, internalRef)}
          type="file"
          className={styles.input}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
          tabIndex={-1}
          aria-hidden="true"
        />
        <div
          {...{ [FINRA_UI_ATTR]: componentIds.fileDropZone }}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled || undefined}
          className={clsx(
            styles.dropZone,
            isDragOver && styles.dragOver,
            disabled && styles.disabled,
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
