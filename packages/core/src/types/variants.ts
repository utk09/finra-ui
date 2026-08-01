/**
 * Visual emphasis level - applies to Button, IconButton, Badge, Input, etc.
 *
 * @remarks
 * How *loud* a component is, never what it means: `primary` is the one action
 * a screen is asking for, `secondary` supports it, `tertiary` recedes. Meaning
 * is {@link Sentiment}, and the two combine freely - a tertiary danger button
 * is a quiet destructive action.
 *
 * There is no size axis here; sizing comes from the density system.
 */
export type Variant = "primary" | "secondary" | "tertiary";

/**
 * Colour meaning - orthogonal to variant.
 *
 * @remarks
 * What a component *means*, independent of emphasis. Never the sole carrier of
 * that meaning: pair it with text or an icon, since colour alone fails for
 * colour-blind users and in high-contrast modes.
 */
export type Sentiment = "danger" | "success" | "warning" | "info";

/**
 * Validation state for form inputs.
 *
 * @remarks
 * Only `"error"` changes ARIA - it sets `aria-invalid` on the control. The
 * others are visual, so a field can read as warning or success without being
 * announced as invalid.
 *
 * Deliberately narrower than {@link Sentiment}: `"info"` is not a validation
 * outcome, and a field is never "danger", it is invalid.
 */
export type ValidationStatus = "error" | "warning" | "success";
