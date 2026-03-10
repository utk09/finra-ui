import type { Ref } from "react";

export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): (value: T | null) => void {
  return (value: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref && typeof ref === "object") {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    }
  };
}
