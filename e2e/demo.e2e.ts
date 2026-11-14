import { test, expect } from "@playwright/test";

const actions = [
  "Show the new work update",
  "Show the AI suggestion",
  "Approve task and assign Saad",
  "Confirm the sample check passed",
  "Report the blocker to Mohammed",
  "Reassign the checkout task to Saad",
  "Pick up the task",
];

test("one guided story preserves approval, progress, availability, and handoff", async ({
  page,
}) => {
  await page.goto("/demo");
  const progress = page.getByRole("progressbar");
  await expect(progress).toHaveAttribute("aria-valuenow", "33");
  await expect(
    page.getByRole("heading", { name: "Mohammed’s workspace" }),
  ).toBeVisible();
  await page.getByRole("button", { name: actions[0], exact: false }).click();
  await expect(
    page.getByRole("heading", { name: "Saad’s workspace" }),
  ).toBeVisible();
  await expect(progress).toHaveAttribute("aria-valuenow", "33");
  await page.getByRole("button", { name: actions[1], exact: false }).click();
  await expect(page.locator(".walk-task")).toHaveCount(3);
  await expect(
    page.getByText("“Stop incomplete orders” is still a proposal.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: actions[2], exact: false }).click();
  await expect(progress).toHaveAttribute("aria-valuenow", "25");
  await expect(
    page.getByRole("heading", { name: "Aymen’s workspace" }),
  ).toBeVisible();
  await page.getByRole("button", { name: actions[3], exact: false }).click();
  await expect(progress).toHaveAttribute("aria-valuenow", "50");
  await expect(
    page.getByRole("heading", { name: "Mehdi’s workspace" }),
  ).toBeVisible();
  await page.getByRole("button", { name: actions[4], exact: false }).click();
  await expect(
    page.getByRole("heading", { name: "Mohammed’s workspace" }),
  ).toBeVisible();
  await expect(
    page.locator(".walk-task").filter({ hasText: "Build the checkout page" }),
  ).toContainText("Blocked");
  await expect(
    page.locator(".walk-workload li").filter({ hasText: "Saad" }),
  ).toContainText("2 finished / 0 unfinished");
  await page.getByRole("button", { name: actions[5], exact: false }).click();
  await expect(
    page.getByRole("heading", { name: "Saad’s workspace" }),
  ).toBeVisible();
  await expect(
    page.locator(".walk-task").filter({ hasText: "Build the checkout page" }),
  ).toContainText("Blocked");
  await expect(
    page.getByText("“The page layout is ready.", { exact: false }),
  ).toBeVisible();
  await expect(progress).toHaveAttribute("aria-valuenow", "50");
  await page.getByRole("button", { name: actions[6], exact: false }).click();
  await expect(page.locator(".walk-task")).toHaveCount(4);
  await expect(
    page.locator(".walk-task").filter({ hasText: "Build the checkout page" }),
  ).toContainText("In progress");
  await expect(
    page.getByText("Checkout blocker: under investigation", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Explore each member’s workspace" })
    .click();
  for (const name of ["Mohammed", "Saad", "Mehdi", "Aymen"]) {
    await page
      .getByRole("group", { name: "View as a team member" })
      .getByRole("button", { name: new RegExp(name) })
      .click();
    await expect(
      page.getByRole("heading", { name: `${name}’s workspace` }),
    ).toBeVisible();
    if (name === "Mehdi")
      await expect(page.locator(".walk-task")).toHaveCount(0);
    if (name === "Saad")
      await expect(page.locator(".walk-task")).toHaveCount(3);
  }
  await page.getByRole("button", { name: "Previous" }).click();
  await expect(
    page.getByRole("heading", { name: "Saad’s workspace" }),
  ).toBeVisible();
  await expect(
    page.locator(".walk-task").filter({ hasText: "Build the checkout page" }),
  ).toContainText("Blocked");
  await page.getByRole("button", { name: "Start again" }).click();
  await expect(progress).toHaveAttribute("aria-valuenow", "33");
  await expect(page.locator(".walk-task")).toHaveCount(3);
});

test("all guided screens fit mobile and notes are optional", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo");
  await expect(page.locator(".demo-notes")).toHaveCount(0);
  await page.getByRole("button", { name: "Show speaker notes" }).click();
  await expect(page.locator(".demo-notes")).toBeVisible();
  await page.getByRole("button", { name: "Hide speaker notes" }).click();
  for (const action of actions) {
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: action, exact: false }).click();
  }
  await page.getByRole("button", { name: "Replay the story" }).click();
  await expect(
    page.getByRole("button", { name: actions[0], exact: false }),
  ).toBeVisible();
});
