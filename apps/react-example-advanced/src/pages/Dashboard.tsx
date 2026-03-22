import {
  Badge,
  ComboBox,
  type ComboBoxOption,
  Divider,
  FormField,
  NumberInput,
} from "@utk09/finra-ui";
import { useState, useSyncExternalStore } from "react";

import { instruments } from "../data/instruments";
import { getOrders } from "../store/orders";

const instrumentOptions: ComboBoxOption[] = instruments.map((i) => ({
  value: i.symbol,
  label: `${i.symbol} - ${i.name}`,
  group: i.sector,
}));

function subscribe(cb: () => void) {
  window.addEventListener("orders-updated", cb);
  return () => window.removeEventListener("orders-updated", cb);
}

const statusSentiment = {
  pending: "warning",
  filled: "success",
  cancelled: "danger",
  partial: "info",
} as const;

export function Dashboard() {
  const orders = useSyncExternalStore(subscribe, getOrders);
  const [lookupSymbol, setLookupSymbol] = useState<string | null>(null);
  const [positionSize, setPositionSize] = useState<number | "">(100);

  const filled = orders.filter((o) => o.status === "filled");
  const pending = orders.filter((o) => o.status === "pending" || o.status === "partial");

  const totalValue = filled.reduce((sum, o) => sum + o.quantity * o.price, 0);
  const dayPnl = filled.reduce(
    (sum, o) => sum + o.quantity * (o.side === "buy" ? 1 : -1) * o.price * 0.02,
    0,
  );

  const lookedUpInstrument = lookupSymbol
    ? instruments.find((i) => i.symbol === lookupSymbol)
    : null;

  const cardStyle: React.CSSProperties = {
    padding: "1rem",
    border: "1px solid var(--finra-color-border)",
    borderRadius: "8px",
    flex: "1 1 200px",
  };

  return (
    <div>
      <h1 style={{ marginBlockStart: 0 }}>Dashboard</h1>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={cardStyle}>
          <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>Total Value</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>Day P&amp;L</div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}>
            ${Math.abs(dayPnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            <Badge variant="primary" sentiment={dayPnl >= 0 ? "success" : "danger"}>
              {dayPnl >= 0 ? "+" : "-"}
              {Math.abs((dayPnl / (totalValue || 1)) * 100).toFixed(2)}%
            </Badge>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>Open Positions</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{filled.length}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>Pending Orders</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{pending.length}</div>
        </div>
      </div>

      <Divider />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div>
          <h2>Instrument Lookup</h2>
          <ComboBox
            options={instrumentOptions}
            value={lookupSymbol}
            onChange={(v) => setLookupSymbol(v as string | null)}
            placeholder="Search instruments..."
          />
          {lookedUpInstrument && (
            <div
              style={{
                marginBlockStart: "0.75rem",
                padding: "0.75rem",
                border: "1px solid var(--finra-color-border)",
                borderRadius: "6px",
              }}>
              <strong>{lookedUpInstrument.symbol}</strong> - {lookedUpInstrument.name}
              <div style={{ display: "flex", gap: "0.5rem", marginBlockStart: "0.25rem" }}>
                <Badge variant="tertiary">{lookedUpInstrument.sector}</Badge>
                <span style={{ fontWeight: 600 }}>${lookedUpInstrument.price.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div style={{ marginBlockStart: "1rem" }}>
            <FormField label="Quick Position Size">
              <NumberInput
                value={positionSize}
                onChange={(v) => setPositionSize(v ?? 100)}
                min={1}
                max={10000}
                step={10}
                aria-label="Position size"
              />
            </FormField>
            {lookedUpInstrument && positionSize !== "" && (
              <div style={{ fontSize: "0.8rem", opacity: 0.7, marginBlockStart: "0.25rem" }}>
                Notional: $
                {(positionSize * lookedUpInstrument.price).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          <h2>Recent Activity</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.5rem 0.75rem",
                  border: "1px solid var(--finra-color-border)",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                }}>
                <div>
                  <strong>{order.instrument}</strong>
                  <span style={{ marginInlineStart: "0.5rem", opacity: 0.7 }}>
                    {order.side.toUpperCase()} {order.quantity} @ ${order.price.toFixed(2)}
                  </span>
                </div>
                <Badge variant="primary" sentiment={statusSentiment[order.status]}>
                  {order.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
