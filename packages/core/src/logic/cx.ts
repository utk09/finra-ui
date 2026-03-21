/**
 * Lightweight class-name joiner for unstyled components.
 * Only joins truthy values - returns undefined when empty.
 * Styled components use `clsx` from the clsx package instead.
 */
export function cx(...classes: (string | false | undefined | null)[]): string | undefined {
  const result = classes.filter(Boolean).join(" ");
  return result || undefined;
}
