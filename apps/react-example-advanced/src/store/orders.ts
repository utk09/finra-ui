import { generateMockOrders } from "../data/mockOrders";
import type { Order } from "../types";

const ORDERS_KEY = "finra-dashboard-orders";

// Cached snapshot for useSyncExternalStore (must return stable reference)
let _cachedRaw: string | null = null;
let _cachedOrders: Order[] = [];

function refreshCache(): void {
  const raw = localStorage.getItem(ORDERS_KEY);
  if (raw === _cachedRaw) return;
  _cachedRaw = raw;
  _cachedOrders = raw ? (JSON.parse(raw) as Order[]) : [];
}

function save(orders: Order[]): void {
  const json = JSON.stringify(orders);
  localStorage.setItem(ORDERS_KEY, json);
  _cachedRaw = json;
  _cachedOrders = orders;
  window.dispatchEvent(new Event("orders-updated"));
}

export function getOrders(): Order[] {
  refreshCache();
  if (_cachedOrders.length === 0 && !localStorage.getItem(ORDERS_KEY)) {
    const seed = generateMockOrders();
    save(seed);
    return _cachedOrders;
  }
  return _cachedOrders;
}

export function addOrder(order: Order): void {
  const orders = [order, ...getOrders()];
  save(orders);
}

export function updateOrderStatus(id: string, status: Order["status"]): void {
  const orders = getOrders().map((o) => (o.id === id ? { ...o, status } : o));
  save(orders);
}

export function clearOrders(): void {
  localStorage.removeItem(ORDERS_KEY);
  _cachedRaw = null;
  _cachedOrders = [];
  window.dispatchEvent(new Event("orders-updated"));
}
