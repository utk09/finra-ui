import type { CartItem } from "../types";

const CART_KEY = "finra-ecommerce-cart";
const THEME_KEY = "finra-ecommerce-theme";
const DENSITY_KEY = "finra-ecommerce-density";

// Cached snapshots for useSyncExternalStore (must return stable references)
let _cachedRaw: string | null = null;
let _cachedCart: CartItem[] = [];
let _cachedCount = 0;
let _cachedTotal = 0;

function refreshCache(): void {
  const raw = localStorage.getItem(CART_KEY);
  if (raw === _cachedRaw) return;
  _cachedRaw = raw;
  _cachedCart = raw ? (JSON.parse(raw) as CartItem[]) : [];
  _cachedCount = _cachedCart.reduce((sum, item) => sum + item.quantity, 0);
  _cachedTotal = _cachedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Snapshot getters (stable references between changes)
export function getCart(): CartItem[] {
  refreshCache();
  return _cachedCart;
}

export function getCartCount(): number {
  refreshCache();
  return _cachedCount;
}

export function getCartTotal(): number {
  refreshCache();
  return _cachedTotal;
}

function saveCart(cart: CartItem[]): void {
  const json = JSON.stringify(cart);
  localStorage.setItem(CART_KEY, json);
  // Invalidate cache immediately
  _cachedRaw = json;
  _cachedCart = cart;
  _cachedCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  _cachedTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(item: Omit<CartItem, "quantity">, quantity: number): void {
  const cart = [...getCart()];
  const key = `${item.productId}-${item.size}-${item.color}`;
  const existing = cart.find((c) => `${c.productId}-${c.size}-${c.color}` === key);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...item, quantity });
  }
  saveCart(cart);
}

export function updateQuantity(
  productId: string,
  size: string,
  color: string,
  quantity: number,
): void {
  const cart = [...getCart()];
  const key = `${productId}-${size}-${color}`;
  const idx = cart.findIndex((c) => `${c.productId}-${c.size}-${c.color}` === key);
  if (idx !== -1) {
    if (quantity <= 0) {
      cart.splice(idx, 1);
    } else {
      cart[idx] = { ...cart[idx], quantity };
    }
  }
  saveCart(cart);
}

export function removeFromCart(productId: string, size: string, color: string): void {
  const cart = getCart().filter(
    (c) => !(c.productId === productId && c.size === size && c.color === color),
  );
  saveCart(cart);
}

export function clearCart(): void {
  saveCart([]);
}

export function getTheme(): "light" | "dark" {
  return (localStorage.getItem(THEME_KEY) as "light" | "dark") ?? "light";
}

export function setTheme(t: "light" | "dark"): void {
  localStorage.setItem(THEME_KEY, t);
}

export function getDensity(): "high" | "medium" | "low" {
  return (localStorage.getItem(DENSITY_KEY) as "high" | "medium" | "low") ?? "medium";
}

export function setDensity(d: "high" | "medium" | "low"): void {
  localStorage.setItem(DENSITY_KEY, d);
}

export function clearAllStorage(): void {
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(THEME_KEY);
  localStorage.removeItem(DENSITY_KEY);
  _cachedRaw = null;
  _cachedCart = [];
  _cachedCount = 0;
  _cachedTotal = 0;
  window.dispatchEvent(new Event("cart-updated"));
}
