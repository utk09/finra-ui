import {
  Badge,
  Button,
  Checkbox,
  Divider,
  FileDropZone,
  FormField,
  Input,
  PillInput,
  Slider,
} from "@utk09/finra-ui";
import { useCallback, useState } from "react";

export function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [priority, setPriority] = useState("50");
  const [description, setDescription] = useState("");
  const [validate, setValidate] = useState(true);
  const [processed, setProcessed] = useState(false);

  const priorityLabel = Number(priority) < 33 ? "Low" : Number(priority) < 66 ? "Medium" : "High";

  const handleProcess = useCallback(() => {
    if (files.length === 0) return;
    setProcessed(true);
  }, [files]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setTags([]);
    setPriority("50");
    setDescription("");
    setValidate(true);
    setProcessed(false);
  }, []);

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ marginBlockStart: 0 }}>Upload Trade Files</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <FormField label="Trade Files" helperText="Upload .csv or .xlsx trade files" required>
          <FileDropZone
            onChange={setFiles}
            accept=".csv,.xlsx,.xls"
            multiple
            aria-label="Upload trade files">
            {files.length > 0 ? (
              <span>
                {files.length} file{files.length !== 1 ? "s" : ""}:{" "}
                {files.map((f) => f.name).join(", ")}
              </span>
            ) : undefined}
          </FileDropZone>
        </FormField>

        <FormField label="Description" helperText="Optional description for this upload batch">
          <Input
            placeholder="Q1 reconciliation trades..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
          />
        </FormField>

        <FormField label="Tags" helperText="Press Enter to add tags">
          <PillInput
            values={tags}
            onChange={setTags}
            placeholder="e.g. recon, q1-2026..."
            maxPills={10}
          />
        </FormField>

        <FormField label="Processing Priority" helperText={`${priorityLabel} (${priority}%)`}>
          <Slider
            min={0}
            max={100}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            label="Priority"
            showValue
            aria-label="Processing priority"
          />
        </FormField>

        <Checkbox
          label="Validate data before processing"
          checked={validate}
          onChange={(e) => setValidate(e.target.checked)}
        />

        <Divider />

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Button variant="primary" onClick={handleProcess} disabled={files.length === 0}>
            Process Files
          </Button>
          <Button variant="secondary" onClick={handleReset}>
            Reset
          </Button>

          {files.length > 0 && !processed && (
            <Badge variant="primary" sentiment="info">
              {files.length} file{files.length !== 1 ? "s" : ""} ready
            </Badge>
          )}

          {processed && (
            <Badge variant="primary" sentiment="success">
              Files processed successfully!
            </Badge>
          )}
        </div>

        {processed && files.length > 0 && (
          <>
            <Divider />
            <div>
              <h3>Processing Results</h3>
              <div
                style={{
                  border: "1px solid var(--finra-color-border)",
                  borderRadius: "6px",
                  overflow: "hidden",
                }}>
                {files.map((file, i) => (
                  <div
                    key={file.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem 0.75rem",
                      borderBlockEnd:
                        i < files.length - 1 ? "1px solid var(--finra-color-border)" : "none",
                      fontSize: "0.85rem",
                    }}>
                    <span>{file.name}</span>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ opacity: 0.6 }}>{(file.size / 1024).toFixed(1)} KB</span>
                      <Badge variant="primary" sentiment="success">
                        {validate ? "Validated" : "Processed"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {tags.length > 0 && (
                <div style={{ marginBlockStart: "0.5rem", fontSize: "0.85rem" }}>
                  Tags:{" "}
                  {tags.map((t) => (
                    <Badge key={t} variant="tertiary" style={{ marginInlineEnd: "0.25rem" }}>
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
