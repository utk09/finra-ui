import "@testing-library/jest-dom";

import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

configure({ testIdAttribute: "data-finra-ui" });

afterEach(() => {
  cleanup();
});
