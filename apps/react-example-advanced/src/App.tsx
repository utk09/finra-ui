import "@utk09/finra-ui/styles";

import {
  Button,
  Calendar,
  ComboBox,
  type ComboBoxOption,
  DateInput,
  Divider,
  FileDropZone,
  FormField,
  Input,
  NumberInput,
  PillInput,
  Slider,
} from "@utk09/finra-ui";
import { DateTenorInput, TenorInput } from "@utk09/finra-ui/finance";
import { type ChangeEvent, useState } from "react";

type Density = "high" | "medium" | "low";
type Theme = "light" | "dark";

const countryOptions: ComboBoxOption[] = [
  { value: "us", label: "United States" },
  { value: "gb", label: "United Kingdom" },
  { value: "de", label: "Germany" },
  { value: "jp", label: "Japan" },
  { value: "au", label: "Australia" },
  { value: "br", label: "Brazil" },
];

const fruitOptions: ComboBoxOption[] = [
  { value: "apple", label: "Apple", group: "Pome Fruits" },
  { value: "pear", label: "Pear", group: "Pome Fruits" },
  { value: "banana", label: "Banana", group: "Tropical" },
  { value: "mango", label: "Mango", group: "Tropical" },
  { value: "pineapple", label: "Pineapple", group: "Tropical" },
  { value: "strawberry", label: "Strawberry", group: "Berries" },
  { value: "blueberry", label: "Blueberry", group: "Berries" },
  { value: "raspberry", label: "Raspberry", group: "Berries" },
];

const pageStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  padding: "2rem",
  fontFamily: "system-ui, sans-serif",
};

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-start",
  gap: "1rem",
};

const controlBarStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  alignItems: "center",
  padding: "1rem",
  borderRadius: "8px",
  border: "1px solid #ccc",
};

const cardStyle: React.CSSProperties = {
  padding: "1rem",
  borderRadius: "8px",
  border: "1px solid #e0e0e0",
  flex: "1 1 280px",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "1rem",
};

export function App() {
  const [density, setDensity] = useState<Density>("medium");
  const [theme, setTheme] = useState<Theme>("light");

  // ComboBox state
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedFruits, setSelectedFruits] = useState<string[]>([]);
  const [creatableOptions, setCreatableOptions] = useState<ComboBoxOption[]>(countryOptions);
  const [creatableValue, setCreatableValue] = useState<string | null>(null);

  // Date & Calendar state
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date | null>(null);
  const [constrainedDate, setConstrainedDate] = useState<Date | null>(null);

  // Finance state
  const [tenor, setTenor] = useState<string | null>(null);
  const [dtDate, setDtDate] = useState<Date | null>(null);
  const [dtTenor, setDtTenor] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [amount, setAmount] = useState<number | "">(0);
  const [tags, setTags] = useState<string[]>([]);
  const [percentage, setPercentage] = useState("50");
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const handleCreateOption = (inputValue: string) => {
    const newOption: ComboBoxOption = {
      value: inputValue.toLowerCase().replace(/\s+/g, "-"),
      label: inputValue,
    };
    setCreatableOptions((prev) => [...prev, newOption]);
    setCreatableValue(newOption.value);
  };

  const handleFormSubmit = (e: ChangeEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const nameValidation = submitted && fullName.trim().length === 0;
  const amountValidation = submitted && (amount === "" || amount <= 0);

  const minDate = new Date(2025, 0, 1);
  const maxDate = new Date(2026, 11, 31);

  return (
    <div style={pageStyle}>
      <h1>finra-ui Advanced Example</h1>

      <section style={sectionStyle}>
        <h2>Controls</h2>
        <div style={controlBarStyle}>
          <span>Density:</span>
          {(["high", "medium", "low"] as const).map((d) => (
            <Button
              key={d}
              variant={density === d ? "primary" : "secondary"}
              onClick={() => setDensity(d)}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </Button>
          ))}
          <span style={{ marginInlineStart: "1rem" }}>Theme:</span>
          {(["light", "dark"] as const).map((t) => (
            <Button
              key={t}
              variant={theme === t ? "primary" : "secondary"}
              onClick={() => setTheme(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>
      </section>

      <Divider />

      <div data-density={density} data-theme={theme}>
        {/* Section 1: ComboBox */}
        <section style={sectionStyle}>
          <h2>ComboBox</h2>
          <div style={rowStyle}>
            <div style={cardStyle}>
              <h3 style={{ marginBlockStart: 0 }}>Single Select</h3>
              <ComboBox
                options={countryOptions}
                value={selectedCountry}
                onChange={(v) => setSelectedCountry(v as string | null)}
                placeholder="Select a country..."
              />
              <p style={{ fontSize: "0.875rem", color: "#666" }}>
                Selected: {selectedCountry ?? "none"}
              </p>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginBlockStart: 0 }}>Multi Select (grouped)</h3>
              <ComboBox
                multiple
                options={fruitOptions}
                value={selectedFruits}
                onChange={(v) => setSelectedFruits((v as string[]) ?? [])}
                placeholder="Pick fruits..."
              />
              <p style={{ fontSize: "0.875rem", color: "#666" }}>
                Selected: {selectedFruits.length > 0 ? selectedFruits.join(", ") : "none"}
              </p>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginBlockStart: 0 }}>Creatable</h3>
              <ComboBox
                creatable
                options={creatableOptions}
                value={creatableValue}
                onChange={(v) => setCreatableValue(v as string | null)}
                onCreateOption={handleCreateOption}
                placeholder="Search or create..."
                formatCreateLabel={(input) => `Add "${input}"`}
              />
              <p style={{ fontSize: "0.875rem", color: "#666" }}>
                Options: {creatableOptions.length} | Selected: {creatableValue ?? "none"}
              </p>
            </div>
          </div>
        </section>

        <Divider />

        {/* Section 2: Date & Calendar */}
        <section style={sectionStyle}>
          <h2>Date & Calendar</h2>
          <div style={rowStyle}>
            <div style={cardStyle}>
              <h3 style={{ marginBlockStart: 0 }}>DateInput</h3>
              <DateInput
                format="YYYY-MM-DD"
                value={dateValue}
                onChange={setDateValue}
                aria-label="Select a date"
              />
              <p style={{ fontSize: "0.875rem", color: "#666" }}>
                Value: {dateValue ? dateValue.toISOString().slice(0, 10) : "none"}
              </p>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginBlockStart: 0 }}>DateInput (constrained)</h3>
              <DateInput
                format="DD/MM/YYYY"
                value={constrainedDate}
                onChange={setConstrainedDate}
                min={minDate}
                max={maxDate}
                aria-label="Constrained date"
              />
              <p style={{ fontSize: "0.875rem", color: "#666" }}>Range: 2025-01-01 to 2026-12-31</p>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginBlockStart: 0 }}>Calendar</h3>
              <Calendar value={calendarDate} onSelect={setCalendarDate} />
              <p style={{ fontSize: "0.875rem", color: "#666" }}>
                Selected: {calendarDate ? calendarDate.toISOString().slice(0, 10) : "none"}
              </p>
            </div>
          </div>
        </section>

        <Divider />

        {/* Section 3: Finance Components */}
        <section style={sectionStyle}>
          <h2>Finance Components</h2>
          <div style={rowStyle}>
            <div style={cardStyle}>
              <h3 style={{ marginBlockStart: 0 }}>TenorInput</h3>
              <TenorInput
                value={tenor}
                onChange={setTenor}
                allowCustom
                placeholder="Select tenor..."
                aria-label="Tenor"
              />
              <p style={{ fontSize: "0.875rem", color: "#666" }}>Tenor: {tenor ?? "none"}</p>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginBlockStart: 0 }}>DateTenorInput</h3>
              <DateTenorInput
                dateValue={dtDate}
                tenorValue={dtTenor}
                onChange={({ date, tenor: t }) => {
                  setDtDate(date);
                  setDtTenor(t);
                }}
                dateFormat="YYYY-MM-DD"
              />
              <p style={{ fontSize: "0.875rem", color: "#666" }}>
                Date: {dtDate ? dtDate.toISOString().slice(0, 10) : "none"}
                {" | "}
                Tenor: {dtTenor ?? "none"}
              </p>
            </div>
          </div>
        </section>

        <Divider />

        {/* Section 4: Form Composition */}
        <section style={sectionStyle}>
          <h2>Form Composition</h2>
          <form onSubmit={handleFormSubmit}>
            <div style={formGridStyle}>
              <FormField
                label="Full Name"
                helperText="Enter your full name"
                required
                validationStatus={nameValidation ? "error" : undefined}
                errorMessage={nameValidation ? "Name is required" : undefined}>
                <Input
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                  fullWidth
                />
              </FormField>

              <FormField
                label="Amount"
                helperText="Enter a positive number"
                required
                validationStatus={amountValidation ? "error" : undefined}
                errorMessage={amountValidation ? "Amount must be greater than 0" : undefined}>
                <NumberInput
                  value={amount}
                  onChange={(v) => setAmount(v ?? "")}
                  min={0}
                  max={1000000}
                  step={100}
                  precision={2}
                  fullWidth
                  aria-label="Amount"
                />
              </FormField>

              <FormField label="Tags" helperText="Press Enter to add a tag">
                <PillInput
                  values={tags}
                  onChange={setTags}
                  placeholder="Add tags..."
                  maxPills={10}
                />
              </FormField>

              <FormField label="Allocation %" helperText={`Current: ${percentage}%`}>
                <Slider
                  value={percentage}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPercentage(e.target.value)}
                  min={0}
                  max={100}
                  label="Allocation"
                  showValue
                  aria-label="Allocation percentage"
                />
              </FormField>
            </div>

            <div style={{ marginBlockStart: "1rem" }}>
              <FormField label="Documents" helperText="Drop files or click to upload">
                <FileDropZone
                  onChange={setFiles}
                  accept=".pdf,.csv,.xlsx"
                  multiple
                  aria-label="Upload documents">
                  {files.length > 0 ? (
                    <span>
                      {files.length} file{files.length !== 1 ? "s" : ""} selected:{" "}
                      {files.map((f) => f.name).join(", ")}
                    </span>
                  ) : undefined}
                </FileDropZone>
              </FormField>
            </div>

            <div style={{ marginBlockStart: "1.5rem", display: "flex", gap: "0.5rem" }}>
              <Button type="submit" variant="primary">
                Submit
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFullName("");
                  setAmount(0);
                  setTags([]);
                  setPercentage("50");
                  setFiles([]);
                  setSubmitted(false);
                }}>
                Reset
              </Button>
            </div>

            {submitted && !nameValidation && !amountValidation && (
              <p style={{ color: "green", marginBlockStart: "0.5rem" }}>
                Form submitted successfully.
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
