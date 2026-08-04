import { Component, type ErrorInfo, type ReactNode } from "react";

/** What a render-prop fallback receives. */
export interface ErrorBoundaryFallbackProps {
  /** The error that was caught. */
  error: Error;
  /** Clear the error and attempt to render `children` again. */
  reset: () => void;
}

/** Props for {@link ErrorBoundary}. */
export interface ErrorBoundaryProps {
  /** The subtree to guard. */
  children?: ReactNode;
  /**
   * What to show once an error has been caught. Defaults to nothing.
   *
   * @remarks
   * A render prop receives the error and a `reset` callback, so a fallback can
   * offer a retry. Retrying only helps if whatever caused the error has changed;
   * calling `reset` while the same render still throws lands straight back in
   * the fallback.
   */
  fallback?: ReactNode | ((props: ErrorBoundaryFallbackProps) => ReactNode);
  /**
   * Called when an error is caught, before the fallback renders.
   *
   * @remarks
   * The place to forward to error reporting. React also logs caught errors to
   * the console itself.
   */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Stops a render error in one subtree from unmounting the whole application.
 *
 * @remarks
 * React has no hook equivalent: catching a render error requires a class
 * component, which is why this one exists rather than being left to the
 * consumer.
 *
 * A boundary only catches errors thrown while rendering its own descendants
 * during the React lifecycle. Errors in event handlers, in `setTimeout`, in
 * promise rejections, and in the boundary's own `fallback` all escape it, and
 * so does anything thrown by an ancestor. Wrap the regions that must survive
 * independently rather than putting one boundary at the root and assuming
 * everything is covered.
 *
 * Renders no DOM of its own, so it adds no element to style or select.
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={({ error, reset }) => (
 *     <div role="alert">
 *       {error.message} <button onClick={reset}>Retry</button>
 *     </div>
 *   )}
 *   onError={(error, info) => report(error, info)}>
 *   <PositionsTable />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { fallback } = this.props;
    return typeof fallback === "function"
      ? fallback({ error, reset: this.reset })
      : (fallback ?? null);
  }
}
