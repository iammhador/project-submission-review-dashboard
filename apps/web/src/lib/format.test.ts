import { describe, expect, it } from "vitest";

import { displayUrl, formatDate, formatDateTime } from "./format";

describe("displayUrl", () => {
  it.each([
    ["https://github.com/ada/portfolio", "github.com/ada/portfolio"],
    ["https://github.com/ada/portfolio/", "github.com/ada/portfolio"],
    ["https://weather.example.dev/", "weather.example.dev"],
    ["http://localhost:3000/demo", "localhost:3000/demo"],
  ])("shortens %s", (input, expected) => {
    expect(displayUrl(input)).toBe(expected);
  });

  it("returns anything that is not a URL unchanged", () => {
    expect(displayUrl("not a url")).toBe("not a url");
  });
});

describe("date formatting", () => {
  it("formats dates and date-times in a readable English style", () => {
    const value = "2026-10-24T09:05:00.000Z";

    expect(formatDate(value)).toMatch(/^Oct 2[34], 2026$/);
    expect(formatDateTime(value)).toMatch(/^Oct 2[34], 2026, \d{1,2}:\d{2}\s?[AP]M$/);
  });
});
