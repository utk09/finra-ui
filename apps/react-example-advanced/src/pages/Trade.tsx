import {
  Badge,
  Button,
  Calendar,
  Checkbox,
  ComboBox,
  type ComboBoxOption,
  Divider,
  FormField,
  NumberInput,
  PillInput,
  RadioButton,
  Slider,
  Switch,
  Textarea,
} from "@utk09/finra-ui";
import { DateTenorInput, TenorInput } from "@utk09/finra-ui/finance";
import { type ChangeEvent, useCallback, useState } from "react";

import { instruments } from "../data/instruments";
import { addOrder } from "../store/orders";

const instrumentOptions: ComboBoxOption[] = instruments.map((i) => ({
  value: i.symbol,
  label: `${i.symbol} - ${i.name}`,
  group: i.sector,
}));

const orderTypeOptions: ComboBoxOption[] = [
  { value: "market", label: "Market" },
  { value: "limit", label: "Limit" },
  { value: "stop", label: "Stop" },
  { value: "stop-limit", label: "Stop-Limit" },
];

export function Trade() {
  const [instrument, setInstrument] = useState<string | null>(null);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<string | null>("limit");
  const [quantity, setQuantity] = useState<number | "">(100);
  const [price, setPrice] = useState<number | "">(0);
  const [tenor, setTenor] = useState<string | null>("T+2");
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [expiryTenor, setExpiryTenor] = useState<string | null>(null);
  const [valueDate, setValueDate] = useState<Date | null>(null);
  const [gtc, setGtc] = useState(false);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [allocation, setAllocation] = useState("100");
  const [marketData, setMarketData] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedInstrument = instrument ? instruments.find((i) => i.symbol === instrument) : null;

  const instrumentError = submitted && !instrument;
  const quantityError = submitted && (quantity === "" || quantity <= 0);
  const priceError = submitted && orderType !== "market" && (price === "" || price <= 0);

  const handleSubmit = useCallback(
    (e: ChangeEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitted(true);

      if (!instrument || quantity === "" || quantity <= 0) return;
      if (orderType !== "market" && (price === "" || price <= 0)) return;

      const order = {
        id: `ORD-${Date.now().toString(36).toUpperCase()}`,
        instrument,
        side,
        type: (orderType ?? "limit") as "market" | "limit" | "stop" | "stop-limit",
        quantity,
        price:
          orderType === "market" && selectedInstrument
            ? selectedInstrument.price
            : (price as number),
        status: "pending" as const,
        tenor: tenor ?? "T+2",
        expiry: expiryDate ? expiryDate.toISOString().slice(0, 10) : null,
        valueDate: valueDate ? valueDate.toISOString().slice(0, 10) : null,
        tags,
        notes,
        createdAt: new Date().toISOString(),
      };

      addOrder(order);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
    [
      instrument,
      side,
      orderType,
      quantity,
      price,
      tenor,
      expiryDate,
      valueDate,
      tags,
      notes,
      selectedInstrument,
    ],
  );

  const handleReset = useCallback(() => {
    setInstrument(null);
    setSide("buy");
    setOrderType("limit");
    setQuantity(100);
    setPrice(0);
    setTenor("T+2");
    setExpiryDate(null);
    setExpiryTenor(null);
    setValueDate(null);
    setGtc(false);
    setNotes("");
    setTags([]);
    setAllocation("100");
    setSubmitted(false);
    setSuccess(false);
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ marginBlockStart: 0 }}>Order Entry</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Switch
            checked={marketData}
            onChange={(e) => setMarketData(e.target.checked)}
            label="Market Data"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <FormField
              label="Instrument"
              required
              validationStatus={instrumentError ? "error" : undefined}
              errorMessage={instrumentError ? "Select an instrument" : undefined}>
              <ComboBox
                options={instrumentOptions}
                value={instrument}
                onChange={(v) => {
                  setInstrument(v as string | null);
                  const inst = instruments.find((i) => i.symbol === v);
                  if (inst) setPrice(inst.price);
                }}
                placeholder="Search instruments..."
              />
            </FormField>

            {selectedInstrument && marketData && (
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  border: "1px solid var(--finra-color-border)",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                }}>
                <strong>{selectedInstrument.symbol}</strong> - Last: $
                {selectedInstrument.price.toFixed(2)}
                <Badge variant="tertiary" style={{ marginInlineStart: "0.5rem" }}>
                  {selectedInstrument.sector}
                </Badge>
              </div>
            )}

            <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
              <legend style={{ fontWeight: 500, marginBlockEnd: "0.5rem" }}>Side</legend>
              <div style={{ display: "flex", gap: "1rem" }}>
                <RadioButton
                  name="side"
                  value="buy"
                  label="Buy"
                  checked={side === "buy"}
                  onChange={() => setSide("buy")}
                />
                <RadioButton
                  name="side"
                  value="sell"
                  label="Sell"
                  checked={side === "sell"}
                  onChange={() => setSide("sell")}
                />
              </div>
            </fieldset>

            <FormField label="Order Type">
              <ComboBox
                options={orderTypeOptions}
                value={orderType}
                onChange={(v) => setOrderType(v as string | null)}
                placeholder="Select type..."
              />
            </FormField>

            <FormField
              label="Quantity"
              required
              validationStatus={quantityError ? "error" : undefined}
              errorMessage={quantityError ? "Quantity must be positive" : undefined}>
              <NumberInput
                value={quantity}
                onChange={(v) => setQuantity(v ?? "")}
                min={1}
                max={100000}
                step={10}
                fullWidth
                aria-label="Quantity"
              />
            </FormField>

            {orderType !== "market" && (
              <FormField
                label="Price"
                required
                validationStatus={priceError ? "error" : undefined}
                errorMessage={priceError ? "Price must be positive" : undefined}>
                <NumberInput
                  value={price}
                  onChange={(v) => setPrice(v ?? "")}
                  min={0.01}
                  step={0.01}
                  precision={2}
                  fullWidth
                  aria-label="Price"
                />
              </FormField>
            )}

            <FormField label="Settlement Tenor">
              <TenorInput
                value={tenor}
                onChange={setTenor}
                allowCustom
                placeholder="Select tenor..."
                aria-label="Settlement tenor"
              />
            </FormField>

            <FormField label="Expiry">
              <DateTenorInput
                dateValue={expiryDate}
                tenorValue={expiryTenor}
                onChange={({ date, tenor: t }) => {
                  setExpiryDate(date);
                  setExpiryTenor(t);
                }}
                dateFormat="YYYY-MM-DD"
              />
            </FormField>

            <Checkbox
              label="Good Till Cancelled"
              checked={gtc}
              onChange={(e) => setGtc(e.target.checked)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <FormField label="Value Date">
              <Calendar value={valueDate} onSelect={setValueDate} />
            </FormField>

            <FormField label="Order Notes">
              <Textarea
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormField>

            <FormField label="Tags" helperText="Press Enter to add">
              <PillInput
                values={tags}
                onChange={setTags}
                placeholder="e.g. algo, hedge..."
                maxPills={10}
              />
            </FormField>

            <FormField label="Allocation" helperText={`${allocation}%`}>
              <Slider
                min={0}
                max={100}
                value={allocation}
                onChange={(e) => setAllocation(e.target.value)}
                aria-label="Allocation percentage"
              />
            </FormField>
          </div>
        </div>

        <Divider />

        {instrument && quantity !== "" && quantity > 0 && (
          <div
            style={{
              padding: "0.75rem",
              border: "1px solid var(--finra-color-border)",
              borderRadius: "6px",
              marginBlockEnd: "1rem",
              fontSize: "0.9rem",
            }}>
            <strong>Order Preview:</strong>{" "}
            <Badge variant="tertiary" sentiment={side === "buy" ? "success" : "danger"}>
              {side.toUpperCase()}
            </Badge>{" "}
            {quantity} {instrument} @{" "}
            {orderType === "market"
              ? "MKT"
              : `$${typeof price === "number" ? price.toFixed(2) : "-"}`}
            {tenor && <span> | Settle: {tenor}</span>}
            {tags.length > 0 && <span> | Tags: {tags.join(", ")}</span>}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button type="submit" variant="primary" sentiment={side === "buy" ? "success" : "danger"}>
            Submit {side === "buy" ? "Buy" : "Sell"} Order
          </Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            Reset
          </Button>
        </div>

        {success && (
          <Badge variant="primary" sentiment="success" style={{ marginBlockStart: "0.75rem" }}>
            Order submitted successfully!
          </Badge>
        )}
      </form>
    </div>
  );
}
