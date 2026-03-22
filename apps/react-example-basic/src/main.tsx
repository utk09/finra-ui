import "@utk09/finra-ui/styles";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { App } from "./App";

const root = createRoot(document.getElementById("root") as HTMLElement);

if (!root) {
  throw new Error("Failed to find the root element");
}

root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
