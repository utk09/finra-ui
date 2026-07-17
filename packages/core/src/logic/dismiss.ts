/**
 * Framework-agnostic dismiss stack for overlays (popovers, menus, dialogs).
 *
 * Overlays register a layer; the stack decides which layer(s) an Escape press
 * or an outside pointer should dismiss. The React `DismissableLayer` and a
 * future Lit adapter both drive this same core - the decision logic never
 * duplicates per framework.
 *
 * Uses `pointerdown` (covers mouse, touch and pen on the supported browser
 * floor) rather than `mousedown`, which does not fire reliably on iOS Safari -
 * the bug in the old `useClickOutside`.
 */

export type DismissReason = "escape" | "outside";

export interface DismissLayerHandle {
  /** The element that bounds this layer; pointers outside it dismiss it. */
  getElement: () => Element | null;
  onDismiss: (reason: DismissReason) => void;
  /** Ignore Escape for this layer. */
  disableEscape?: boolean;
  /** Ignore outside pointers for this layer. */
  disableOutsidePointer?: boolean;
  /**
   * Extra elements that count as "inside" for outside-pointer detection - e.g. a
   * popover's trigger, so clicking it toggles (via its own handler) instead of
   * dismissing here and immediately re-opening.
   */
  getExtraElements?: () => readonly (Element | null)[];
}

//  Pure decision helpers (no DOM, no framework - unit tested directly)

/**
 * The layer that should handle Escape: the topmost one, and only if it allows
 * Escape. A topmost layer that opts out swallows the key rather than letting it
 * cascade to a lower layer.
 */
export function getEscapeTarget(
  stack: readonly DismissLayerHandle[],
): DismissLayerHandle | undefined {
  const top = stack[stack.length - 1];
  if (!top || top.disableEscape) return undefined;
  return top;
}

/**
 * The layers to dismiss for an outside pointer, given a predicate telling
 * whether the point falls inside a layer. Scans top-down: once the point is
 * inside a layer, lower layers are considered "inside" too and scanning stops;
 * layers that opt out of outside-dismiss are skipped without blocking lower ones.
 */
export function getOutsideDismissals(
  stack: readonly DismissLayerHandle[],
  isInside: (layer: DismissLayerHandle) => boolean,
): DismissLayerHandle[] {
  const result: DismissLayerHandle[] = [];
  for (let i = stack.length - 1; i >= 0; i--) {
    const layer = stack[i];
    if (isInside(layer)) break;
    if (!layer.disableOutsidePointer) result.push(layer);
  }
  return result;
}

/**
 * Whether a pointer target falls inside a layer - either within its own element
 * or within one of its extra ("excluded") elements, e.g. the trigger. Pure so it
 * can be unit-tested across every branch without a real DOM.
 */
export function isPointerInsideLayer(layer: DismissLayerHandle, node: Node | null): boolean {
  if (!node) return false;
  const el = layer.getElement();
  if (el && el.contains(node)) return true;
  const extras = layer.getExtraElements?.() ?? [];
  return extras.some((extra) => !!extra && extra.contains(node));
}

//  Stateful stack + global DOM listeners (the DOM adapter over the helpers)

const activeStack: DismissLayerHandle[] = [];

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key !== "Escape") return;
  getEscapeTarget(activeStack)?.onDismiss("escape");
}

function handlePointerDown(event: Event): void {
  const node = event.target as Node | null;
  const dismissals = getOutsideDismissals(activeStack, (layer) =>
    isPointerInsideLayer(layer, node),
  );
  for (const layer of dismissals) layer.onDismiss("outside");
}

function attachListeners(): void {
  // Capture phase so we still see events that inner handlers stop propagating.
  document.addEventListener("keydown", handleKeyDown, true);
  document.addEventListener("pointerdown", handlePointerDown, true);
}

function detachListeners(): void {
  document.removeEventListener("keydown", handleKeyDown, true);
  document.removeEventListener("pointerdown", handlePointerDown, true);
}

/**
 * Register a dismiss layer (pushes it onto the top of the stack). Global
 * listeners attach on the first layer and detach when the last unregisters.
 * Returns an unregister function.
 */
export function registerDismissLayer(handle: DismissLayerHandle): () => void {
  if (activeStack.length === 0) attachListeners();
  activeStack.push(handle);

  return () => {
    const index = activeStack.indexOf(handle);
    if (index >= 0) activeStack.splice(index, 1);
    if (activeStack.length === 0) detachListeners();
  };
}
