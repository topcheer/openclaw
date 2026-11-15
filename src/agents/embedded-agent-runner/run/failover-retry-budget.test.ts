import { describe, expect, it } from "vitest";
import { resolveTransientRetryBudget } from "./failover-retry-controller.js";

// #retry-999 (teamclaw, 2026-11-15): the installed 2026.11.3 build clamped
// EVERY rate-limit storm to 9 retries regardless of agent settings - operators
// stamped retry.provider.maxRetries=999 and workers still died at 9. The
// explicit-budget exemption is the fix; these tests pin both sides of the
// contract so it cannot regress silently.
describe("resolveTransientRetryBudget", () => {
  it("explicit budget 999 survives a rate-limit storm (not clamped to 9 or 15)", () => {
    expect(
      resolveTransientRetryBudget({
        transientRetryBudget: 999,
        rateLimit: true,
        rateLimitSeen: true,
        sharedTpmFallback: false,
      }),
    ).toBe(999);
  });

  it("explicit small budgets keep their exact value (operator instruction)", () => {
    expect(
      resolveTransientRetryBudget({
        transientRetryBudget: 3,
        rateLimit: true,
        rateLimitSeen: true,
        sharedTpmFallback: false,
      }),
    ).toBe(3);
  });

  it("unset budget keeps the conservative rate-limit default (15) once rate-limit seen", () => {
    expect(
      resolveTransientRetryBudget({
        transientRetryBudget: undefined,
        rateLimit: true,
        rateLimitSeen: true,
        sharedTpmFallback: false,
      }),
    ).toBe(15);
  });

  it("unset budget with no rate-limit keeps the transient default (8)", () => {
    expect(
      resolveTransientRetryBudget({
        transientRetryBudget: undefined,
        rateLimit: false,
        rateLimitSeen: false,
        sharedTpmFallback: false,
      }),
    ).toBe(8);
  });
});
