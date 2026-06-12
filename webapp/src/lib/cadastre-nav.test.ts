import { describe, it, expect, beforeEach } from "vitest";
import { saveNav, loadNav, CADASTRE_NAV_KEY } from "./cadastre-nav";

beforeEach(() => {
  sessionStorage.clear();
});

describe("saveNav + loadNav", () => {
  it("round-trip preserves ids, index, backUrl", () => {
    saveNav(["rec1", "rec2", "rec3"], 1, "/");
    const ctx = loadNav();
    expect(ctx).toEqual({ ids: ["rec1", "rec2", "rec3"], index: 1, backUrl: "/" });
  });

  it("round-trip preserves optional backQuery", () => {
    saveNav(["rec1", "rec2"], 0, "/", "bourdet");
    const ctx = loadNav();
    expect(ctx?.backQuery).toBe("bourdet");
  });

  it("overwrites previous context", () => {
    saveNav(["rec1"], 0, "/");
    saveNav(["rec9", "rec10"], 1, "/parcelles-meres/abc");
    const ctx = loadNav();
    expect(ctx?.ids).toEqual(["rec9", "rec10"]);
    expect(ctx?.backUrl).toBe("/parcelles-meres/abc");
  });
});

describe("loadNav", () => {
  it("returns null when sessionStorage is empty", () => {
    expect(loadNav()).toBeNull();
  });

  it("returns null when sessionStorage contains invalid JSON", () => {
    sessionStorage.setItem(CADASTRE_NAV_KEY, "not-json{{{");
    expect(loadNav()).toBeNull();
  });

  it("returns null when key is missing", () => {
    sessionStorage.setItem("other-key", JSON.stringify({ ids: ["rec1"] }));
    expect(loadNav()).toBeNull();
  });
});

describe("wrap-around logic", () => {
  it("prev from index 0 wraps to last", () => {
    const ids = ["rec1", "rec2", "rec3"];
    saveNav(ids, 0, "/");
    const ctx = loadNav()!;
    const total = ctx.ids.length;
    const prevIndex = (ctx.index - 1 + total) % total;
    expect(prevIndex).toBe(2);
  });

  it("next from last index wraps to 0", () => {
    const ids = ["rec1", "rec2", "rec3"];
    saveNav(ids, 2, "/");
    const ctx = loadNav()!;
    const total = ctx.ids.length;
    const nextIndex = (ctx.index + 1) % total;
    expect(nextIndex).toBe(0);
  });
});
