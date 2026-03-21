import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";

const root = createRoot(document.getElementById("root") as HTMLElement);

if (!root) {
  throw new Error("Failed to find the root element");
}

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
