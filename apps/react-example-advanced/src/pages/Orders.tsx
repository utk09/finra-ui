import {
  Badge,
  Button,
  ButtonGroup,
  ComboBox,
  type ComboBoxOption,
  Divider,
  Input,
  RadioButton,
} from "@utk09/finra-ui";
import { DateInput } from "@utk09/finra-ui-finance";
import { useMemo, useState, useSyncExternalStore } from "react";

import { instruments } from "../data/instruments";
import { getOrders, updateOrderStatus } from "../store/orders";

const instrumentOptions: ComboBoxOption[] = instruments.map((i) => ({
  value: i.symbol,
  label: i.symbol,
}));

const statusOptions: ComboBoxOption[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "filled", label: "Filled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "partial", label: "Partial" },
];

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

type ViewFilter = "all" | "active" | "completed";

export function Orders() {
  const orders = useSyncExternalStore(subscribe, getOrders);

  const [search, setSearch] = useState("");
  const [instrumentFilter, setInstrumentFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>("all");
  const [sideFilter, setSideFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (
        search &&
        !o.instrument.toLowerCase().includes(search.toLowerCase()) &&
        !o.id.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (instrumentFilter && o.instrument !== instrumentFilter) return false;
      if (statusFilter && statusFilter !== "all" && o.status !== statusFilter) return false;
      if (sideFilter !== "all" && o.side !== sideFilter) return false;
      if (dateFrom) {
        const orderDate = new Date(o.createdAt);
        if (orderDate < dateFrom) return false;
      }
      if (dateTo) {
        const orderDate = new Date(o.createdAt);
        if (orderDate > dateTo) return false;
      }
      if (viewFilter === "active" && (o.status === "filled" || o.status === "cancelled"))
        return false;
      if (viewFilter === "completed" && o.status !== "filled" && o.status !== "cancelled")
        return false;
      return true;
    });
  }, [orders, search, instrumentFilter, statusFilter, sideFilter, dateFrom, dateTo, viewFilter]);

  return (
    <div>
      <h1 style={{ marginBlockStart: 0 }}>Order Blotter</h1>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "flex-end",
          marginBlockEnd: "1rem",
        }}>
        <div style={{ flex: "1 1 180px" }}>
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            aria-label="Search orders"
          />
        </div>
        <div style={{ flex: "0 0 160px" }}>
          <ComboBox
            options={instrumentOptions}
            value={instrumentFilter}
            onChange={(v) => setInstrumentFilter(v as string | null)}
            placeholder="Instrument..."
          />
        </div>
        <div style={{ flex: "0 0 140px" }}>
          <ComboBox
            options={statusOptions}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as string | null)}
            placeholder="Status..."
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
          marginBlockEnd: "1rem",
        }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem" }}>Side:</span>
          {["all", "buy", "sell"].map((s) => (
            <RadioButton
              key={s}
              name="side-filter"
              value={s}
              label={s.charAt(0).toUpperCase() + s.slice(1)}
              checked={sideFilter === s}
              onChange={() => setSideFilter(s)}
            />
          ))}
        </div>

        <Divider />

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem" }}>From:</span>
          <DateInput
            format="YYYY-MM-DD"
            value={dateFrom}
            onChange={setDateFrom}
            aria-label="Date from"
          />
          <span style={{ fontSize: "0.85rem" }}>To:</span>
          <DateInput format="YYYY-MM-DD" value={dateTo} onChange={setDateTo} aria-label="Date to" />
        </div>
      </div>

      <ButtonGroup>
        {(["all", "active", "completed"] as const).map((v) => (
          <Button
            key={v}
            variant={viewFilter === v ? "primary" : "secondary"}
            onClick={() => setViewFilter(v)}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </Button>
        ))}
      </ButtonGroup>

      <Divider />

      {filtered.length === 0 && (
        <p style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>
          No orders match your filters.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {filtered.map((order, i) => (
          <div key={order.id}>
            {i > 0 && <Divider />}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "80px 70px 60px 80px 80px 80px 90px 1fr auto",
                gap: "0.75rem",
                alignItems: "center",
                padding: "0.6rem 0",
                fontSize: "0.85rem",
              }}>
              <strong>{order.instrument}</strong>
              <Badge variant="tertiary" sentiment={order.side === "buy" ? "success" : "danger"}>
                {order.side.toUpperCase()}
              </Badge>
              <span>{order.quantity}</span>
              <span>${order.price.toFixed(2)}</span>
              <span>{order.type}</span>
              <span>{order.tenor}</span>
              <Badge variant="primary" sentiment={statusSentiment[order.status]}>
                {order.status}
              </Badge>
              <span style={{ opacity: 0.6 }}>{new Date(order.createdAt).toLocaleDateString()}</span>
              {(order.status === "pending" || order.status === "partial") && (
                <Button
                  variant="tertiary"
                  sentiment="danger"
                  onClick={() => updateOrderStatus(order.id, "cancelled")}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
