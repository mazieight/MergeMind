import { describe, expect, it } from "vitest";
import { eventInput, memberInput } from "../src/lib/contracts";

describe("external input validation", () => {
  it("rejects client-supplied ownership and roles on events", () => {
    expect(
      eventInput.safeParse({
        name: "Event",
        slug: "event",
        created_by: "attacker",
      }).success,
    ).toBe(false);
  });
  it("rejects malformed slugs and empty names", () => {
    expect(
      eventInput.safeParse({ name: "  ", slug: "../private" }).success,
    ).toBe(false);
  });
  it("rejects global/organizer roles in team membership input", () => {
    expect(
      memberInput.safeParse({
        user_id: "00000000-0000-4000-8000-000000000001",
        role: "organizer",
      }).success,
    ).toBe(false);
  });
});
