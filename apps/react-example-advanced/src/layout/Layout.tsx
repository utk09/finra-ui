import { Button, ButtonGroup, Divider, Switch } from "@utk09/finra-ui";
import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router";

import { clearAllStorage, getDensity, getTheme, setDensity, setTheme } from "../store/preferences";

type Density = "high" | "medium" | "low";
type Theme = "light" | "dark";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/orders", label: "Orders" },
  { to: "/trade", label: "Trade" },
  { to: "/upload", label: "Upload" },
];

const sidebarStyle: React.CSSProperties = {
  width: 220,
  flexShrink: 0,
  borderInlineEnd: "1px solid var(--finra-color-border)",
  display: "flex",
  flexDirection: "column",
  padding: "1rem",
  gap: "0.25rem",
};

const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
  display: "block",
  padding: "0.5rem 0.75rem",
  borderRadius: "6px",
  textDecoration: "none",
  color: "inherit",
  fontWeight: isActive ? 600 : 400,
  background: isActive ? "var(--finra-color-primary-50)" : "transparent",
});

export function Layout() {
  const [density, _setDensity] = useState<Density>(getDensity);
  const [theme, _setTheme] = useState<Theme>(getTheme);

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
    window.location.reload();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div
      data-density={density}
      data-theme={theme}
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--finra-color-background)",
        color: "var(--finra-color-foreground)",
      }}>
      <aside style={sidebarStyle}>
        <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>FINRA Trading</h2>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              style={({ isActive }) => navLinkStyle(isActive)}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Divider />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            paddingBlockStart: "0.5rem",
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.8rem" }}>Dark</span>
            <Switch
              checked={theme === "dark"}
              onChange={() => handleTheme(theme === "dark" ? "light" : "dark")}
              label=""
              aria-label="Toggle dark mode"
            />
          </div>
          <Button variant="tertiary" sentiment="danger" onClick={handleClear}>
            Clear Data
          </Button>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            borderBlockEnd: "1px solid var(--finra-color-border)",
          }}>
          <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Density:</span>
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
        </header>

        <main style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
