import { describe, expect, it } from "vitest";
import { canTransitionOrder } from "./index";

describe("order lifecycle", () => {
  it("allows the production happy path", () => {
    expect(canTransitionOrder("new", "accepted")).toBe(true);
    expect(canTransitionOrder("accepted", "preparing")).toBe(true);
    expect(canTransitionOrder("preparing", "ready")).toBe(true);
    expect(canTransitionOrder("ready", "completed")).toBe(true);
  });

  it("rejects illegal transitions", () => {
    expect(canTransitionOrder("new", "completed")).toBe(false);
    expect(canTransitionOrder("completed", "preparing")).toBe(false);
    expect(canTransitionOrder("cancelled", "accepted")).toBe(false);
  });
});
