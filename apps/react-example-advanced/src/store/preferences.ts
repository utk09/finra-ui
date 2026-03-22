const THEME_KEY = "finra-dashboard-theme";
const DENSITY_KEY = "finra-dashboard-density";

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
  localStorage.removeItem(THEME_KEY);
  localStorage.removeItem(DENSITY_KEY);
  localStorage.removeItem("finra-dashboard-orders");
  window.dispatchEvent(new Event("orders-updated"));
}
