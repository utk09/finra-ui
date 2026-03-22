/**
 * Framework-agnostic SVG icon data.
 *
 * Each icon is a plain object describing the SVG element and its children.
 * Consumers can render these with any framework (React, Lit, vanilla DOM).
 */

export type SvgChild =
  | { tag: "path"; d: string }
  | { tag: "rect"; x: number; y: number; width: number; height: number; rx?: number; ry?: number }
  | { tag: "line"; x1: number; y1: number; x2: number; y2: number }
  | { tag: "circle"; cx: number; cy: number; r: number; opacity?: number }
  | { tag: "polyline"; points: string };

export interface IconData {
  name: string;
  viewBox: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeLinecap?: "round" | "butt" | "square";
  strokeLinejoin?: "round" | "miter" | "bevel";
  children: SvgChild[];
}

export const calendarIcon: IconData = {
  name: "calendar",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 3, y: 4, width: 18, height: 18, rx: 2, ry: 2 },
    { tag: "line", x1: 16, y1: 2, x2: 16, y2: 6 },
    { tag: "line", x1: 8, y1: 2, x2: 8, y2: 6 },
    { tag: "line", x1: 3, y1: 10, x2: 21, y2: 10 },
  ],
};

export const checkIcon: IconData = {
  name: "check",
  viewBox: "0 0 12 12",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "path", d: "M2.5 6l2.5 2.5 4.5-5" }],
};

export const chevronDownIcon: IconData = {
  name: "chevron-down",
  viewBox: "0 0 12 12",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "path", d: "M3 4.5l3 3 3-3" }],
};

export const chevronLeftIcon: IconData = {
  name: "chevron-left",
  viewBox: "0 0 12 12",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "path", d: "M7.5 3l-3 3 3 3" }],
};

export const chevronRightIcon: IconData = {
  name: "chevron-right",
  viewBox: "0 0 12 12",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "path", d: "M4.5 3l3 3-3 3" }],
};

export const closeIcon: IconData = {
  name: "close",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "path", d: "M18 6 6 18M6 6l12 12" }],
};

export const closeSmallIcon: IconData = {
  name: "close-small",
  viewBox: "0 0 12 12",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  children: [{ tag: "path", d: "M3 3l6 6M9 3l-6 6" }],
};

export const dashIcon: IconData = {
  name: "dash",
  viewBox: "0 0 12 12",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  children: [{ tag: "path", d: "M2.5 6h7" }],
};

export const minusIcon: IconData = {
  name: "minus",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  children: [{ tag: "path", d: "M5 12h14" }],
};

export const plusIcon: IconData = {
  name: "plus",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  children: [{ tag: "path", d: "M12 5v14M5 12h14" }],
};

export const spinnerIcon: IconData = {
  name: "spinner",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  children: [
    { tag: "circle", cx: 12, cy: 12, r: 10, opacity: 0.25 },
    { tag: "path", d: "M12 2a10 10 0 0 1 10 10" },
  ],
};

export const uploadIcon: IconData = {
  name: "upload",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" },
    { tag: "polyline", points: "17 8 12 3 7 8" },
    { tag: "line", x1: 12, y1: 3, x2: 12, y2: 15 },
  ],
};
