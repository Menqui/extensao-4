import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { servidor } from "../src/mocks/servidor";

beforeAll(() => {
  servidor.listen({
    onUnhandledFrame: "error",
  });
});

afterEach(() => {
  cleanup();
  servidor.resetHandlers();
  window.history.replaceState(null, "", "/");
});

afterAll(() => {
  servidor.close();
});