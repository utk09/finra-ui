import { Badge, Button, ButtonGroup, Divider, Switch } from "@utk09/finra-ui";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Link, Outlet } from "react-router";

import {
  clearAllStorage,
  getCartCount,
  getDensity,
  getTheme,
  setDensity,
  setTheme,
} from "../store/cart";

type Density = "high" | "medium" | "low";
type Theme = "light" | "dark";

function subscribeCartUpdates(cb: () => void) {
  window.addEventListener("cart-updated", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("cart-updated", cb);
    window.removeEventListener("storage", cb);
  };
}

export function Layout() {
  const [density, _setDensity] = useState<Density>(getDensity);
  const [theme, _setTheme] = useState<Theme>(getTheme);

  const cartCount = useSyncExternalStore(subscribeCartUpdates, getCartCount);

  const handleDensity = useCallback((d: Density) => {
    _setDensity(d);
    setDensity(d);
  }, []);

  const handleTheme = useCallback((t: Theme) => {
    _setTheme(t);
    setTheme(t);
  }, []);

  const handleClear = useCallback(() => {
    clearAllStorage();
    _setDensity("medium");
    _setTheme("light");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div
      data-density={density}
      data-theme={theme}
      style={{
        minHeight: "100vh",
        background: "var(--finra-color-background)",
        color: "var(--finra-color-foreground)",
      }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "0.75rem 1.5rem",
          borderBlockEnd: "1px solid var(--finra-color-border)",
          flexWrap: "wrap",
        }}>
        <Link
          to="/"
          style={{
            fontWeight: 700,
            fontSize: "1.25rem",
            textDecoration: "none",
            color: "inherit",
          }}>
          ShopUI
        </Link>

        <nav style={{ display: "flex", gap: "0.5rem", flex: 1 }}>
          <Link to="/">
            <Button variant="tertiary">Home</Button>
          </Link>
          <Link to="/cart" style={{ position: "relative" }}>
            <Button variant="tertiary">
              Cart
              {cartCount > 0 && (
                <Badge variant="primary" sentiment="info" style={{ marginInlineStart: "0.25rem" }}>
                  {cartCount}
                </Badge>
              )}
            </Button>
          </Link>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <ButtonGroup>
            {(["high", "medium", "low"] as const).map((d) => (
              <Button
                key={d}
                variant={density === d ? "primary" : "secondary"}
                onClick={() => handleDensity(d)}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </Button>
            ))}
          </ButtonGroup>

          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.875rem" }}>Dark</span>
            <Switch
              checked={theme === "dark"}
              onChange={() => handleTheme(theme === "dark" ? "light" : "dark")}
              label=""
              aria-label="Toggle dark mode"
            />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem" }}>
        <Outlet />
      </main>

      <Divider />

      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1.5rem",
          fontSize: "0.8rem",
          opacity: 0.7,
        }}>
        <span>finra-ui E-Commerce Demo</span>
        <Button variant="tertiary" sentiment="danger" onClick={handleClear}>
          Clear localStorage
        </Button>
      </footer>
    </div>
  );
}
