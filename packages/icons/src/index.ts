/**
 * Framework-agnostic SVG icon data.
 *
 * Each icon is a plain object describing the SVG element and its children.
 * Consumers can render these with any framework (React, Lit, vanilla DOM).
 */

/**
 * One drawable primitive inside an icon, as data rather than markup.
 *
 * @remarks
 * The discriminant is `tag`, matching the SVG element it becomes, so a renderer
 * is a single switch. Keeping icons as data is what makes this package
 * framework-agnostic: the React wrappers in `@utk09/finra-ui-icons/react` are
 * one consumer of it, and a Lit or plain-DOM renderer needs no new source.
 */
export type SvgChild =
  | { tag: "path"; d: string }
  | { tag: "rect"; x: number; y: number; width: number; height: number; rx?: number; ry?: number }
  | { tag: "line"; x1: number; y1: number; x2: number; y2: number }
  | { tag: "circle"; cx: number; cy: number; r: number; opacity?: number }
  | { tag: "polyline"; points: string }
  | { tag: "polygon"; points: string }
  | { tag: "ellipse"; cx: number; cy: number; rx: number; ry: number };

/**
 * A complete icon: the `<svg>` attributes plus the shapes to draw inside it.
 *
 * @remarks
 * Presentation only - there is no `title` or `aria-label` here on purpose. An
 * icon cannot know whether it is decorative beside a text label or the sole
 * content of a button, so naming is the consumer's decision. The React wrappers
 * default to `aria-hidden`, and `IconButton` requires a label of its own.
 *
 * @example
 * ```ts
 * import { SearchIcon } from "@utk09/finra-ui-icons";
 * SearchIcon.viewBox;  // "0 0 24 24"
 * SearchIcon.children; // [{ tag: "circle", … }, { tag: "line", … }]
 * ```
 */
export interface IconData {
  /** Icon name, matching its export identifier. */
  name: string;
  /** SVG user-space viewport, e.g. `"0 0 24 24"`. */
  viewBox: string;
  /** Default fill. Usually `"none"` - these are stroke-drawn outline icons. */
  fill: string;
  /**
   * Default stroke.
   *
   * @remarks
   * `"currentColor"`, so an icon inherits the text colour of whatever contains
   * it and needs no per-theme variant.
   */
  stroke: string;
  /** Stroke width in user-space units. Consistent across the set for visual weight. */
  strokeWidth: number;
  /** Stroke end-cap style. */
  strokeLinecap?: "round" | "butt" | "square";
  /** Stroke corner style. */
  strokeLinejoin?: "round" | "miter" | "bevel";
  /** The shapes to draw, in paint order - later entries render on top. */
  children: SvgChild[];
}

// 1. Core Actions

export const plusIcon: IconData = {
  name: "plus",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  children: [{ tag: "path", d: "M12 5v14M5 12h14" }],
};

export const minusIcon: IconData = {
  name: "minus",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  children: [{ tag: "path", d: "M5 12h14" }],
};

export const dashIcon: IconData = {
  name: "dash",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  children: [{ tag: "path", d: "M5 12h14" }],
};

export const closeIcon: IconData = {
  name: "close",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "path", d: "M18 6 6 18M6 6l12 12" }],
};

export const closeSmallIcon: IconData = {
  name: "close-small",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "path", d: "M8 8l8 8M16 8l-8 8" }],
};

export const spinnerIcon: IconData = {
  name: "spinner",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  children: [
    { tag: "circle", cx: 12, cy: 12, r: 10, opacity: 0.25 },
    { tag: "path", d: "M12 2a10 10 0 0 1 10 10" },
  ],
};

export const downloadIcon: IconData = {
  name: "download",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" },
    { tag: "polyline", points: "7 10 12 15 17 10" },
    { tag: "line", x1: 12, y1: 15, x2: 12, y2: 3 },
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

export const editIcon: IconData = {
  name: "edit",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M12 20h9" },
    { tag: "path", d: "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" },
  ],
};

export const deleteIcon: IconData = {
  name: "delete",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M3 6h18" },
    { tag: "path", d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" },
    { tag: "path", d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" },
  ],
};

export const copyIcon: IconData = {
  name: "copy",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 9, y: 9, width: 13, height: 13, rx: 2, ry: 2 },
    { tag: "path", d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" },
  ],
};

export const shareIcon: IconData = {
  name: "share",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "circle", cx: 18, cy: 5, r: 3 },
    { tag: "circle", cx: 6, cy: 12, r: 3 },
    { tag: "circle", cx: 18, cy: 19, r: 3 },
    { tag: "line", x1: 8.59, y1: 13.51, x2: 15.42, y2: 17.49 },
    { tag: "line", x1: 15.41, y1: 6.51, x2: 8.59, y2: 10.49 },
  ],
};

export const externalLinkIcon: IconData = {
  name: "external-link",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" },
    { tag: "polyline", points: "15 3 21 3 21 9" },
    { tag: "line", x1: 10, y1: 14, x2: 21, y2: 3 },
  ],
};

export const refreshIcon: IconData = {
  name: "refresh",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M23 4v6h-6" },
    { tag: "path", d: "M1 20v-6h6" },
    { tag: "path", d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" },
  ],
};

export const saveIcon: IconData = {
  name: "save",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" },
    { tag: "polyline", points: "17 21 17 13 7 13 7 21" },
    { tag: "polyline", points: "7 3 7 8 15 8" },
  ],
};

export const downloadCloudIcon: IconData = {
  name: "download-cloud",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "polyline", points: "8 17 12 21 16 17" },
    { tag: "line", x1: 12, y1: 12, x2: 12, y2: 21 },
    { tag: "path", d: "M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" },
  ],
};

export const uploadCloudIcon: IconData = {
  name: "upload-cloud",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "polyline", points: "16 16 12 12 8 16" },
    { tag: "line", x1: 12, y1: 12, x2: 12, y2: 21 },
    { tag: "path", d: "M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" },
  ],
};

export const pauseIcon: IconData = {
  name: "pause",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 6, y: 4, width: 4, height: 16, rx: 1 },
    { tag: "rect", x: 14, y: 4, width: 4, height: 16, rx: 1 },
  ],
};

export const playIcon: IconData = {
  name: "play",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "polygon", points: "6 3 20 12 6 21 6 3" }],
};

export const stopIcon: IconData = {
  name: "stop",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "rect", x: 4, y: 4, width: 16, height: 16, rx: 2 }],
};

// 2. Communication

export const mailIcon: IconData = {
  name: "mail",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 2, y: 4, width: 20, height: 16, rx: 2, ry: 2 },
    { tag: "path", d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" },
  ],
};

export const bellIcon: IconData = {
  name: "bell",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" },
    { tag: "path", d: "M13.73 21a2 2 0 0 1-3.46 0" },
  ],
};

export const messageIcon: IconData = {
  name: "message",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "path", d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }],
};

export const sendIcon: IconData = {
  name: "send",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "line", x1: 22, y1: 2, x2: 11, y2: 13 },
    { tag: "polygon", points: "22 2 15 22 11 13 2 9 22 2" },
  ],
};

// 3. Security / User

export const lockIcon: IconData = {
  name: "lock",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 3, y: 11, width: 18, height: 11, rx: 2, ry: 2 },
    { tag: "path", d: "M7 11V7a5 5 0 0 1 10 0v4" },
  ],
};

export const unlockIcon: IconData = {
  name: "unlock",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 3, y: 11, width: 18, height: 11, rx: 2, ry: 2 },
    { tag: "path", d: "M7 11V7a5 5 0 0 1 9.9-1" },
  ],
};

export const userIcon: IconData = {
  name: "user",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" },
    { tag: "circle", cx: 12, cy: 7, r: 4 },
  ],
};

export const usersIcon: IconData = {
  name: "users",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" },
    { tag: "circle", cx: 8.5, cy: 7, r: 4 },
    { tag: "path", d: "M20 21v-2a4 4 0 0 0-3-3.87" },
    { tag: "path", d: "M12.5 3.13a4 4 0 0 1 0 7.75" },
  ],
};

export const keyIcon: IconData = {
  name: "key",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "circle", cx: 7.5, cy: 16.5, r: 4.5 },
    { tag: "path", d: "M10.5 13.5L21 3" },
    { tag: "path", d: "M21 3l-3 3" },
    { tag: "path", d: "M15.5 8.5l2 2" },
  ],
};

export const shieldIcon: IconData = {
  name: "shield",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "path", d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }],
};

// 4. Status / Feedback

export const checkIcon: IconData = {
  name: "check",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "path", d: "M5 12l5 5 9-10" }],
};

export const infoIcon: IconData = {
  name: "info",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "circle", cx: 12, cy: 12, r: 10 },
    { tag: "line", x1: 12, y1: 16, x2: 12, y2: 12 },
    { tag: "line", x1: 12, y1: 8, x2: 12.01, y2: 8 },
  ],
};

export const warningIcon: IconData = {
  name: "warning",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    {
      tag: "path",
      d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
    },
    { tag: "line", x1: 12, y1: 9, x2: 12, y2: 13 },
    { tag: "line", x1: 12, y1: 17, x2: 12.01, y2: 17 },
  ],
};

export const errorIcon: IconData = {
  name: "error",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "circle", cx: 12, cy: 12, r: 10 },
    { tag: "line", x1: 15, y1: 9, x2: 9, y2: 15 },
    { tag: "line", x1: 9, y1: 9, x2: 15, y2: 15 },
  ],
};

export const successCircleIcon: IconData = {
  name: "success-circle",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "circle", cx: 12, cy: 12, r: 10 },
    { tag: "polyline", points: "9 12 11 14 15 10" },
  ],
};

export const helpCircleIcon: IconData = {
  name: "help-circle",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "circle", cx: 12, cy: 12, r: 10 },
    { tag: "path", d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" },
    { tag: "line", x1: 12, y1: 17, x2: 12.01, y2: 17 },
  ],
};

// 5. Navigation Essentials

export const chevronDownIcon: IconData = {
  name: "chevron-down",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "path", d: "M6 9l6 6 6-6" }],
};

export const chevronLeftIcon: IconData = {
  name: "chevron-left",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "path", d: "M15 6l-6 6 6 6" }],
};

export const chevronRightIcon: IconData = {
  name: "chevron-right",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "path", d: "M9 6l6 6-6 6" }],
};

export const chevronUpIcon: IconData = {
  name: "chevron-up",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "path", d: "M6 15l6-6 6 6" }],
};

export const moreHorizontalIcon: IconData = {
  name: "more-horizontal",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  children: [
    { tag: "circle", cx: 12, cy: 12, r: 1 },
    { tag: "circle", cx: 19, cy: 12, r: 1 },
    { tag: "circle", cx: 5, cy: 12, r: 1 },
  ],
};

export const moreVerticalIcon: IconData = {
  name: "more-vertical",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  children: [
    { tag: "circle", cx: 12, cy: 12, r: 1 },
    { tag: "circle", cx: 12, cy: 5, r: 1 },
    { tag: "circle", cx: 12, cy: 19, r: 1 },
  ],
};

export const arrowUpIcon: IconData = {
  name: "arrow-up",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "line", x1: 12, y1: 19, x2: 12, y2: 5 },
    { tag: "polyline", points: "5 12 12 5 19 12" },
  ],
};

export const arrowDownIcon: IconData = {
  name: "arrow-down",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "line", x1: 12, y1: 5, x2: 12, y2: 19 },
    { tag: "polyline", points: "19 12 12 19 5 12" },
  ],
};

export const arrowLeftIcon: IconData = {
  name: "arrow-left",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "line", x1: 19, y1: 12, x2: 5, y2: 12 },
    { tag: "polyline", points: "12 19 5 12 12 5" },
  ],
};

export const arrowRightIcon: IconData = {
  name: "arrow-right",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "line", x1: 5, y1: 12, x2: 19, y2: 12 },
    { tag: "polyline", points: "12 5 19 12 12 19" },
  ],
};

export const homeIcon: IconData = {
  name: "home",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
    { tag: "polyline", points: "9 22 9 12 15 12 15 22" },
  ],
};

export const settingsIcon: IconData = {
  name: "settings",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "circle", cx: 12, cy: 12, r: 3 },
    {
      tag: "path",
      d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z",
    },
  ],
};

// 6. Data, Forms, and Table UX

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

export const searchIcon: IconData = {
  name: "search",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "circle", cx: 11, cy: 11, r: 7 },
    { tag: "line", x1: 16, y1: 16, x2: 21, y2: 21 },
  ],
};

export const filterIcon: IconData = {
  name: "filter",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "polygon", points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" }],
};

export const eyeIcon: IconData = {
  name: "eye",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" },
    { tag: "circle", cx: 12, cy: 12, r: 3 },
  ],
};

export const eyeOffIcon: IconData = {
  name: "eye-off",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    {
      tag: "path",
      d: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19",
    },
    { tag: "line", x1: 1, y1: 1, x2: 23, y2: 23 },
  ],
};

export const sortIcon: IconData = {
  name: "sort",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M11 5h10M11 9h7M11 13h4" },
    { tag: "path", d: "M3 17l3 3 3-3M6 18V4" },
  ],
};

export const sortAscIcon: IconData = {
  name: "sort-asc",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M11 5h10M11 9h7M11 13h4" },
    { tag: "path", d: "M3 8l3-3 3 3M6 5v14" },
  ],
};

export const sortDescIcon: IconData = {
  name: "sort-desc",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M11 5h10M11 9h7M11 13h4" },
    { tag: "path", d: "M3 16l3 3 3-3M6 19V5" },
  ],
};

export const funnelOffIcon: IconData = {
  name: "funnel-off",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M12.5 12.5L22 3H2l7.5 8.86V19l4 2v-4.5" },
    { tag: "line", x1: 2, y1: 2, x2: 22, y2: 22 },
  ],
};

export const columnsIcon: IconData = {
  name: "columns",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 3, y: 3, width: 18, height: 18, rx: 2, ry: 2 },
    { tag: "line", x1: 12, y1: 3, x2: 12, y2: 21 },
  ],
};

export const eyeOpenIcon: IconData = {
  name: "eye-open",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" },
    { tag: "circle", cx: 12, cy: 12, r: 3 },
  ],
};

export const eyeClosedIcon: IconData = {
  name: "eye-closed",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    {
      tag: "path",
      d: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19",
    },
    { tag: "line", x1: 1, y1: 1, x2: 23, y2: 23 },
  ],
};

export const searchPlusIcon: IconData = {
  name: "search-plus",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "circle", cx: 11, cy: 11, r: 7 },
    { tag: "line", x1: 16, y1: 16, x2: 21, y2: 21 },
    { tag: "line", x1: 11, y1: 8, x2: 11, y2: 14 },
    { tag: "line", x1: 8, y1: 11, x2: 14, y2: 11 },
  ],
};

export const searchMinusIcon: IconData = {
  name: "search-minus",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "circle", cx: 11, cy: 11, r: 7 },
    { tag: "line", x1: 16, y1: 16, x2: 21, y2: 21 },
    { tag: "line", x1: 8, y1: 11, x2: 14, y2: 11 },
  ],
};

export const checkCircleIcon: IconData = {
  name: "check-circle",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "circle", cx: 12, cy: 12, r: 10 },
    { tag: "path", d: "M8 12l3 3 5-5" },
  ],
};

export const xCircleIcon: IconData = {
  name: "x-circle",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "circle", cx: 12, cy: 12, r: 10 },
    { tag: "path", d: "M15 9l-6 6M9 9l6 6" },
  ],
};

export const alertTriangleIcon: IconData = {
  name: "alert-triangle",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    {
      tag: "path",
      d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
    },
    { tag: "line", x1: 12, y1: 9, x2: 12, y2: 13 },
    { tag: "line", x1: 12, y1: 17, x2: 12.01, y2: 17 },
  ],
};

export const calendarRangeIcon: IconData = {
  name: "calendar-range",
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
    { tag: "path", d: "M7 15h4M13 15h4" },
  ],
};

export const clockIcon: IconData = {
  name: "clock",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "circle", cx: 12, cy: 12, r: 10 },
    { tag: "polyline", points: "12 6 12 12 16 14" },
  ],
};

export const minusSquareIcon: IconData = {
  name: "minus-square",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 3, y: 3, width: 18, height: 18, rx: 2, ry: 2 },
    { tag: "line", x1: 8, y1: 12, x2: 16, y2: 12 },
  ],
};

export const checkSquareIcon: IconData = {
  name: "check-square",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 3, y: 3, width: 18, height: 18, rx: 2, ry: 2 },
    { tag: "path", d: "M9 12l2 2 4-4" },
  ],
};

export const circleDotIcon: IconData = {
  name: "circle-dot",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "circle", cx: 12, cy: 12, r: 10 },
    { tag: "circle", cx: 12, cy: 12, r: 3 },
  ],
};

export const indeterminateIcon: IconData = {
  name: "indeterminate",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 3, y: 3, width: 18, height: 18, rx: 2, ry: 2 },
    { tag: "line", x1: 7, y1: 12, x2: 17, y2: 12 },
  ],
};

export const pinIcon: IconData = {
  name: "pin",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "line", x1: 12, y1: 17, x2: 12, y2: 22 },
    { tag: "path", d: "M5 17h14l-2-6V5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v6L5 17z" },
  ],
};

export const slidersIcon: IconData = {
  name: "sliders",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "line", x1: 4, y1: 21, x2: 4, y2: 14 },
    { tag: "line", x1: 4, y1: 10, x2: 4, y2: 3 },
    { tag: "line", x1: 12, y1: 21, x2: 12, y2: 12 },
    { tag: "line", x1: 12, y1: 8, x2: 12, y2: 3 },
    { tag: "line", x1: 20, y1: 21, x2: 20, y2: 16 },
    { tag: "line", x1: 20, y1: 12, x2: 20, y2: 3 },
    { tag: "line", x1: 1, y1: 14, x2: 7, y2: 14 },
    { tag: "line", x1: 9, y1: 8, x2: 15, y2: 8 },
    { tag: "line", x1: 17, y1: 16, x2: 23, y2: 16 },
  ],
};

// 7. Finance-domain Pack

export const trendingUpIcon: IconData = {
  name: "trending-up",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "polyline", points: "23 6 13.5 15.5 8.5 10.5 1 18" },
    { tag: "polyline", points: "17 6 23 6 23 12" },
  ],
};

export const trendingDownIcon: IconData = {
  name: "trending-down",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "polyline", points: "23 18 13.5 8.5 8.5 13.5 1 6" },
    { tag: "polyline", points: "17 18 23 18 23 12" },
  ],
};

export const candlestickIcon: IconData = {
  name: "candlestick",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "line", x1: 9, y1: 2, x2: 9, y2: 6 },
    { tag: "rect", x: 6, y: 6, width: 6, height: 10, rx: 1 },
    { tag: "line", x1: 9, y1: 16, x2: 9, y2: 22 },
    { tag: "line", x1: 17, y1: 2, x2: 17, y2: 10 },
    { tag: "rect", x: 14, y: 10, width: 6, height: 8, rx: 1 },
    { tag: "line", x1: 17, y1: 18, x2: 17, y2: 22 },
  ],
};

export const chartLineIcon: IconData = {
  name: "chart-line",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "line", x1: 3, y1: 3, x2: 3, y2: 21 },
    { tag: "line", x1: 3, y1: 21, x2: 21, y2: 21 },
    { tag: "polyline", points: "7 14 12 9 16 13 21 6" },
  ],
};

export const percentIcon: IconData = {
  name: "percent",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "line", x1: 19, y1: 5, x2: 5, y2: 19 },
    { tag: "circle", cx: 6.5, cy: 6.5, r: 2.5 },
    { tag: "circle", cx: 17.5, cy: 17.5, r: 2.5 },
  ],
};

export const dollarIcon: IconData = {
  name: "dollar",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "line", x1: 12, y1: 1, x2: 12, y2: 23 },
    { tag: "path", d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  ],
};

export const coinIcon: IconData = {
  name: "coin",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "ellipse", cx: 12, cy: 6, rx: 9, ry: 3 },
    { tag: "path", d: "M21 6v6c0 1.66-4.03 3-9 3s-9-1.34-9-3V6" },
    { tag: "path", d: "M21 12v6c0 1.66-4.03 3-9 3s-9-1.34-9-3v-6" },
  ],
};

export const walletIcon: IconData = {
  name: "wallet",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" },
    { tag: "path", d: "M4 6v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V12a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z" },
    { tag: "circle", cx: 16, cy: 15, r: 1 },
  ],
};

export const clipboardCheckIcon: IconData = {
  name: "clipboard-check",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" },
    { tag: "rect", x: 8, y: 2, width: 8, height: 4, rx: 1, ry: 1 },
    { tag: "path", d: "M9 14l2 2 4-4" },
  ],
};

export const clipboardXIcon: IconData = {
  name: "clipboard-x",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" },
    { tag: "rect", x: 8, y: 2, width: 8, height: 4, rx: 1, ry: 1 },
    { tag: "path", d: "M15 11l-6 6M9 11l6 6" },
  ],
};

export const timerIcon: IconData = {
  name: "timer",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "line", x1: 10, y1: 2, x2: 14, y2: 2 },
    { tag: "line", x1: 12, y1: 14, x2: 15, y2: 11 },
    { tag: "circle", cx: 12, cy: 14, r: 8 },
  ],
};

export const activityIcon: IconData = {
  name: "activity",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "polyline", points: "22 12 18 12 15 21 9 3 6 12 2 12" }],
};

export const targetIcon: IconData = {
  name: "target",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "circle", cx: 12, cy: 12, r: 10 },
    { tag: "circle", cx: 12, cy: 12, r: 6 },
    { tag: "circle", cx: 12, cy: 12, r: 2 },
  ],
};

export const shieldAlertIcon: IconData = {
  name: "shield-alert",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
    { tag: "line", x1: 12, y1: 8, x2: 12, y2: 12 },
    { tag: "line", x1: 12, y1: 16, x2: 12.01, y2: 16 },
  ],
};

export const shieldCheckIcon: IconData = {
  name: "shield-check",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
    { tag: "path", d: "M9 12l2 2 4-4" },
  ],
};

export const fileCheckIcon: IconData = {
  name: "file-check",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
    { tag: "polyline", points: "14 2 14 8 20 8" },
    { tag: "path", d: "M9 15l2 2 4-4" },
  ],
};

export const fileWarningIcon: IconData = {
  name: "file-warning",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
    { tag: "polyline", points: "14 2 14 8 20 8" },
    { tag: "line", x1: 12, y1: 12, x2: 12, y2: 15 },
    { tag: "line", x1: 12, y1: 18, x2: 12.01, y2: 18 },
  ],
};

export const auditTrailIcon: IconData = {
  name: "audit-trail",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
    { tag: "polyline", points: "14 2 14 8 20 8" },
    { tag: "line", x1: 8, y1: 13, x2: 16, y2: 13 },
    { tag: "line", x1: 8, y1: 17, x2: 12, y2: 17 },
    { tag: "circle", cx: 10, cy: 9, r: 1 },
  ],
};

export const bankIcon: IconData = {
  name: "bank",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M3 21h18M3 10h18M12 2l10 5H2l10-5z" },
    { tag: "line", x1: 6, y1: 10, x2: 6, y2: 21 },
    { tag: "line", x1: 10, y1: 10, x2: 10, y2: 21 },
    { tag: "line", x1: 14, y1: 10, x2: 14, y2: 21 },
    { tag: "line", x1: 18, y1: 10, x2: 18, y2: 21 },
  ],
};

export const bitcoinIcon: IconData = {
  name: "bitcoin",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "line", x1: 10, y1: 3, x2: 10, y2: 5 },
    { tag: "line", x1: 14, y1: 3, x2: 14, y2: 5 },
    { tag: "line", x1: 10, y1: 19, x2: 10, y2: 21 },
    { tag: "line", x1: 14, y1: 19, x2: 14, y2: 21 },
    { tag: "path", d: "M7 6h6a3.5 3.5 0 0 1 0 7H7" },
    { tag: "path", d: "M7 13h7a3.5 3.5 0 0 1 0 7H7" },
    { tag: "line", x1: 10, y1: 6, x2: 10, y2: 20 },
  ],
};

export const chartBarIcon: IconData = {
  name: "chart-bar",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "line", x1: 12, y1: 20, x2: 12, y2: 10 },
    { tag: "line", x1: 18, y1: 20, x2: 18, y2: 4 },
    { tag: "line", x1: 6, y1: 20, x2: 6, y2: 14 },
    { tag: "line", x1: 3, y1: 20, x2: 21, y2: 20 },
  ],
};

export const chartPieIcon: IconData = {
  name: "chart-pie",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M21.21 15.89A10 10 0 1 1 8 2.83" },
    { tag: "path", d: "M22 12A10 10 0 0 0 12 2v10z" },
  ],
};

export const commoditiesIcon: IconData = {
  name: "commodities",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "polygon", points: "2 12 6 7 18 7 22 12 2 12" },
    { tag: "polygon", points: "2 12 22 12 18 20 6 20 2 12" },
  ],
};

export const creditIcon: IconData = {
  name: "credit",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 3, y: 3, width: 18, height: 18, rx: 2, ry: 2 },
    { tag: "line", x1: 7, y1: 7, x2: 17, y2: 7 },
    { tag: "line", x1: 7, y1: 11, x2: 13, y2: 11 },
    { tag: "circle", cx: 16, cy: 15.5, r: 2.5 },
  ],
};

export const creditCardIcon: IconData = {
  name: "credit-card",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 2, y: 5, width: 20, height: 14, rx: 2, ry: 2 },
    { tag: "line", x1: 2, y1: 10, x2: 22, y2: 10 },
    { tag: "line", x1: 6, y1: 15, x2: 10, y2: 15 },
  ],
};

export const cryptoIcon: IconData = {
  name: "crypto",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "circle", cx: 12, cy: 12, r: 9 },
    { tag: "path", d: "M12 6v12M8 9l8 6M8 15l8-6" },
  ],
};

export const derivativesIcon: IconData = {
  name: "derivatives",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M7 10a5 5 0 0 1 9-3l3 3" },
    { tag: "path", d: "M19 6v4h-4" },
    { tag: "path", d: "M17 14a5 5 0 0 1-9 3l-3-3" },
    { tag: "path", d: "M5 18v-4h4" },
  ],
};

export const equitiesIcon: IconData = {
  name: "equities",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "line", x1: 3, y1: 20, x2: 21, y2: 20 },
    { tag: "path", d: "M3 16l5-6 4 4 8-9" },
    { tag: "circle", cx: 8, cy: 10, r: 1.5 },
    { tag: "circle", cx: 12, cy: 14, r: 1.5 },
    { tag: "circle", cx: 20, cy: 5, r: 1.5 },
  ],
};

export const euroIcon: IconData = {
  name: "euro",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M18 6a8 8 0 1 0 0 12" },
    { tag: "line", x1: 4, y1: 10, x2: 14, y2: 10 },
    { tag: "line", x1: 4, y1: 14, x2: 14, y2: 14 },
  ],
};

export const fxIcon: IconData = {
  name: "fx",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M16 3l4 4-4 4" },
    { tag: "path", d: "M20 7H8a4 4 0 0 0-4 4v1" },
    { tag: "path", d: "M8 21l-4-4 4-4" },
    { tag: "path", d: "M4 17h12a4 4 0 0 0 4-4v-1" },
  ],
};

export const historyIcon: IconData = {
  name: "history",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M3 12a9 9 0 1 0 3-6.7L3 8" },
    { tag: "polyline", points: "3 3 3 8 8 8" },
    { tag: "polyline", points: "12 7 12 12 16 14" },
  ],
};

export const poundIcon: IconData = {
  name: "pound",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M18 6a4 4 0 0 0-6 0v11a2 2 0 0 0 2 2h5" },
    { tag: "line", x1: 8, y1: 12, x2: 15, y2: 12 },
  ],
};

export const ratesIcon: IconData = {
  name: "rates",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M3 17c4-1 7-5 10-8 3-3 5-4 8-4" },
    { tag: "circle", cx: 7.5, cy: 7.5, r: 2 },
    { tag: "circle", cx: 16.5, cy: 16.5, r: 2 },
  ],
};

export const receiptIcon: IconData = {
  name: "receipt",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M4 2v20l3-2 3 2 3-2 3 2 4-2V2l-4 2-3-2-3 2-3-2-3 2z" },
    { tag: "line", x1: 8, y1: 8, x2: 16, y2: 8 },
    { tag: "line", x1: 8, y1: 12, x2: 16, y2: 12 },
    { tag: "line", x1: 8, y1: 16, x2: 12, y2: 16 },
  ],
};

export const starIcon: IconData = {
  name: "star",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    {
      tag: "polygon",
      points:
        "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2",
    },
  ],
};

export const yenIcon: IconData = {
  name: "yen",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M6 3l6 8 6-8" },
    { tag: "line", x1: 12, y1: 11, x2: 12, y2: 21 },
    { tag: "line", x1: 7, y1: 13, x2: 17, y2: 13 },
    { tag: "line", x1: 7, y1: 17, x2: 17, y2: 17 },
  ],
};

// 8. Utility and Brand Completeness

export const fileIcon: IconData = {
  name: "file",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" },
    { tag: "polyline", points: "13 2 13 9 20 9" },
  ],
};

export const fileTextIcon: IconData = {
  name: "file-text",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
    { tag: "polyline", points: "14 2 14 8 20 8" },
    { tag: "line", x1: 16, y1: 13, x2: 8, y2: 13 },
    { tag: "line", x1: 16, y1: 17, x2: 8, y2: 17 },
    { tag: "line", x1: 10, y1: 9, x2: 8, y2: 9 },
  ],
};

export const paperclipIcon: IconData = {
  name: "paperclip",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    {
      tag: "path",
      d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48",
    },
  ],
};

export const imageIcon: IconData = {
  name: "image",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 3, y: 3, width: 18, height: 18, rx: 2, ry: 2 },
    { tag: "circle", cx: 8.5, cy: 8.5, r: 1.5 },
    { tag: "polyline", points: "21 15 16 10 5 21" },
  ],
};

export const downloadFileIcon: IconData = {
  name: "download-file",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
    { tag: "polyline", points: "14 2 14 8 20 8" },
    { tag: "path", d: "M12 18v-6" },
    { tag: "path", d: "M9 15l3 3 3-3" },
  ],
};

export const gridIcon: IconData = {
  name: "grid",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 3, y: 3, width: 7, height: 7, rx: 1 },
    { tag: "rect", x: 14, y: 3, width: 7, height: 7, rx: 1 },
    { tag: "rect", x: 14, y: 14, width: 7, height: 7, rx: 1 },
    { tag: "rect", x: 3, y: 14, width: 7, height: 7, rx: 1 },
  ],
};

export const listIcon: IconData = {
  name: "list",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "line", x1: 8, y1: 6, x2: 21, y2: 6 },
    { tag: "line", x1: 8, y1: 12, x2: 21, y2: 12 },
    { tag: "line", x1: 8, y1: 18, x2: 21, y2: 18 },
    { tag: "line", x1: 3, y1: 6, x2: 3.01, y2: 6 },
    { tag: "line", x1: 3, y1: 12, x2: 3.01, y2: 12 },
    { tag: "line", x1: 3, y1: 18, x2: 3.01, y2: 18 },
  ],
};

export const panelLeftIcon: IconData = {
  name: "panel-left",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 3, y: 3, width: 18, height: 18, rx: 2, ry: 2 },
    { tag: "line", x1: 9, y1: 3, x2: 9, y2: 21 },
  ],
};

export const panelRightIcon: IconData = {
  name: "panel-right",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 3, y: 3, width: 18, height: 18, rx: 2, ry: 2 },
    { tag: "line", x1: 15, y1: 3, x2: 15, y2: 21 },
  ],
};

export const monitorIcon: IconData = {
  name: "monitor",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 2, y: 3, width: 20, height: 14, rx: 2, ry: 2 },
    { tag: "line", x1: 8, y1: 21, x2: 16, y2: 21 },
    { tag: "line", x1: 12, y1: 17, x2: 12, y2: 21 },
  ],
};

export const mobileIcon: IconData = {
  name: "mobile",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "rect", x: 5, y: 2, width: 14, height: 20, rx: 2, ry: 2 },
    { tag: "line", x1: 12, y1: 18, x2: 12.01, y2: 18 },
  ],
};

export const logInIcon: IconData = {
  name: "log-in",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" },
    { tag: "polyline", points: "10 17 15 12 10 7" },
    { tag: "line", x1: 15, y1: 12, x2: 3, y2: 12 },
  ],
};

export const logOutIcon: IconData = {
  name: "log-out",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" },
    { tag: "polyline", points: "16 17 21 12 16 7" },
    { tag: "line", x1: 21, y1: 12, x2: 9, y2: 12 },
  ],
};

export const powerIcon: IconData = {
  name: "power",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "path", d: "M18.36 6.64a9 9 0 1 1-12.73 0" },
    { tag: "line", x1: 12, y1: 2, x2: 12, y2: 12 },
  ],
};

export const databaseIcon: IconData = {
  name: "database",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "ellipse", cx: 12, cy: 5, rx: 9, ry: 3 },
    { tag: "path", d: "M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3" },
    { tag: "path", d: "M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" },
  ],
};

export const cloudIcon: IconData = {
  name: "cloud",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [{ tag: "path", d: "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" }],
};

export const cloudOffIcon: IconData = {
  name: "cloud-off",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "line", x1: 1, y1: 1, x2: 23, y2: 23 },
    {
      tag: "path",
      d: "M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0-2 11.29A5 5 0 0 0 9 20h9a4.91 4.91 0 0 0 2.22-.53",
    },
  ],
};

export const printerIcon: IconData = {
  name: "printer",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  children: [
    { tag: "polyline", points: "6 9 6 2 18 2 18 9" },
    {
      tag: "path",
      d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",
    },
    { tag: "rect", x: 6, y: 14, width: 12, height: 8, rx: 1 },
  ],
};
