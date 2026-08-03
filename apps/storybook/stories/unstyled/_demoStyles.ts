import type { CSSProperties } from "react";

//  The overlay compounds (Dialog, Popover, Menu, Select, Tooltip) and the
//  primitives they compose (Portal, DismissableLayer, FocusScope) ship no CSS.
//  These demos add just enough inline style to make the portalled content
//  visible; a real app styles them via the `components/` layer or its own CSS.
//
//  The literal colours here are deliberate. Every other story in the library
//  reads a token, but a token would defeat the point of an unstyled demo: the
//  base is being shown with styling the consumer supplies.

/** Panel surface for portalled content, so it is legible over the page. */
export const overlayPanel: CSSProperties = {
  border: "1px solid #8a8a8a",
  borderRadius: 6,
  background: "#ffffff",
  color: "#111111",
  padding: "0.75rem",
  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)",
  maxWidth: 280,
};

/** Anything that opens one of the overlays. */
export const triggerButton: CSSProperties = {
  padding: "0.375rem 0.75rem",
  border: "1px solid #8a8a8a",
  borderRadius: 6,
  background: "#f5f5f5",
  color: "#111111",
  cursor: "pointer",
};

/** A menu row, which is a button and so needs its chrome removed. */
export const menuItemStyle: CSSProperties = {
  display: "block",
  inlineSize: "100%",
  textAlign: "left",
  padding: "0.375rem 0.5rem",
  border: "none",
  borderRadius: 4,
  background: "none",
  cursor: "pointer",
};
