import { setProjectAnnotations } from "@storybook/react-vite";
import { beforeAll } from "vitest";
import * as previewAnnotations from "./preview";
import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";

const annotations = setProjectAnnotations([a11yAddonAnnotations, previewAnnotations]);

beforeAll(annotations.beforeAll);
