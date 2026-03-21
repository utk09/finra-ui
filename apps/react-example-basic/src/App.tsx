import "@utk09/finra-ui/styles";

import {
  Badge,
  Button,
  ButtonGroup,
  Checkbox,
  Divider,
  FormField,
  IconButton,
  Input,
  RadioButton,
  Switch,
  Textarea,
} from "@utk09/finra-ui";
import { useState } from "react";

type Density = "high" | "medium" | "low";
type Theme = "light" | "dark";

const variants = ["primary", "secondary", "tertiary"] as const;
const sentiments = ["danger", "success", "warning", "info"] as const;

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
  alignItems: "center",
  gap: "0.5rem",
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

export function App() {
  const [density, setDensity] = useState<Density>("medium");
  const [theme, setTheme] = useState<Theme>("light");
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [switchChecked, setSwitchChecked] = useState(false);
  const [selectedRadio, setSelectedRadio] = useState("option-1");

  return (
    <div style={pageStyle}>
      <h1>finra-ui Basic Example</h1>

      <section style={sectionStyle}>
        <h2>Density</h2>
        <div style={controlBarStyle}>
          {(["high", "medium", "low"] as const).map((d) => (
            <Button
              key={d}
              variant={density === d ? "primary" : "secondary"}
              onClick={() => setDensity(d)}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </Button>
          ))}
        </div>
      </section>

      <Divider />

      <section style={sectionStyle}>
        <h2>Theme</h2>
        <div style={controlBarStyle}>
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
        <section style={sectionStyle}>
          <h2>Buttons</h2>

          <h3>Variants</h3>
          <div style={rowStyle}>
            {variants.map((v) => (
              <Button key={v} variant={v}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Button>
            ))}
          </div>

          <h3>Sentiments</h3>
          {variants.map((v) => (
            <div key={v}>
              <h4 style={{ margin: "0.25rem 0" }}>{v.charAt(0).toUpperCase() + v.slice(1)}</h4>
              <div style={rowStyle}>
                {sentiments.map((s) => (
                  <Button key={`${v}-${s}`} variant={v} sentiment={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          ))}

          <h3>IconButton</h3>
          <div style={rowStyle}>
            {variants.map((v) => (
              <IconButton
                key={v}
                variant={v}
                icon={<span aria-hidden="true">+</span>}
                aria-label={`Add (${v})`}
              />
            ))}
          </div>

          <h3>ButtonGroup</h3>
          <ButtonGroup>
            <Button variant="secondary">Left</Button>
            <Button variant="secondary">Center</Button>
            <Button variant="secondary">Right</Button>
          </ButtonGroup>
        </section>

        <Divider />

        <section style={sectionStyle}>
          <h2>Form Controls</h2>

          <FormField label="Text Input">
            <Input placeholder="Enter some text" />
          </FormField>

          <FormField label="Textarea">
            <Textarea placeholder="Write something longer here" />
          </FormField>

          <Checkbox
            label="Accept terms"
            checked={checkboxChecked}
            onChange={(e) => setCheckboxChecked(e.target.checked)}
          />

          <Switch
            label="Enable notifications"
            checked={switchChecked}
            onChange={(e) => setSwitchChecked(e.target.checked)}
          />

          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend>Select an option</legend>
            <div style={{ ...rowStyle, marginBlockStart: "0.5rem" }}>
              {["option-1", "option-2", "option-3"].map((value) => (
                <RadioButton
                  key={value}
                  name="demo-radio"
                  value={value}
                  label={`Option ${value.split("-")[1]}`}
                  checked={selectedRadio === value}
                  onChange={() => setSelectedRadio(value)}
                />
              ))}
            </div>
          </fieldset>
        </section>

        <Divider />

        <section style={sectionStyle}>
          <h2>Badge</h2>

          <h3>Variants</h3>
          <div style={rowStyle}>
            {variants.map((v) => (
              <Badge key={v} variant={v}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Badge>
            ))}
          </div>

          <h3>Sentiments</h3>
          {variants.map((v) => (
            <div key={v}>
              <h4 style={{ margin: "0.25rem 0" }}>{v.charAt(0).toUpperCase() + v.slice(1)}</h4>
              <div style={rowStyle}>
                {sentiments.map((s) => (
                  <Badge key={`${v}-${s}`} variant={v} sentiment={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
