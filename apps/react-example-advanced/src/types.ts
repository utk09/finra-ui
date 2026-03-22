export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit" | "stop" | "stop-limit";
export type OrderStatus = "pending" | "filled" | "cancelled" | "partial";

export interface Order {
  id: string;
  instrument: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price: number;
  status: OrderStatus;
  tenor: string;
  expiry: string | null;
  valueDate: string | null;
  tags: string[];
  notes: string;
  createdAt: string;
}

export interface Instrument {
  symbol: string;
  name: string;
  sector: string;
  price: number;
}

export interface PortfolioSummary {
  totalValue: number;
  dayPnl: number;
  openPositions: number;
  pendingOrders: number;
}
