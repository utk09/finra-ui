import { describe, expect, it } from "vitest";

import {
  buildTenorGroups,
  classifyTenor,
  DEFAULT_STANDARD_TENORS,
  flattenGroups,
  moveTenorHighlight,
  type TenorOptionModel,
} from "./tenorPicker";

describe("classifyTenor", () => {
  it("maps specials by code", () => {
    expect(classifyTenor("ON")).toBe("overnight");
    expect(classifyTenor("TN")).toBe("tomorrow");
    expect(classifyTenor("SN")).toBe("spot");
    expect(classifyTenor("SW")).toBe("spot");
  });

  it("maps single-unit tenors to their group", () => {
    expect(classifyTenor("2W")).toBe("weeks");
    expect(classifyTenor("18M")).toBe("months");
    expect(classifyTenor("5Y")).toBe("years");
  });

  it("routes days and compounds to custom", () => {
    expect(classifyTenor("90D")).toBe("custom");
    expect(classifyTenor("1Y6M")).toBe("custom");
    expect(classifyTenor("nonsense")).toBe("custom");
  });
});

describe("buildTenorGroups", () => {
  it("groups the default tenor set in order", () => {
    const groups = buildTenorGroups({ tenors: DEFAULT_STANDARD_TENORS });
    expect(groups.map((g) => g.id)).toEqual([
      "overnight",
      "tomorrow",
      "spot",
      "weeks",
      "months",
      "years",
    ]);
    expect(groups.find((g) => g.id === "weeks")?.options.map((o) => o.tenor)).toEqual([
      "1W",
      "2W",
      "3W",
    ]);
  });

  it("lifts favourites into a pinned first group and removes them from home", () => {
    const groups = buildTenorGroups({
      tenors: DEFAULT_STANDARD_TENORS,
      favourites: ["3M", "1Y"],
    });
    expect(groups[0].id).toBe("favourites");
    expect(groups[0].options.map((o) => o.tenor)).toEqual(["3M", "1Y"]);
    // 3M no longer appears in months.
    expect(groups.find((g) => g.id === "months")?.options.map((o) => o.tenor)).not.toContain("3M");
    expect(groups.find((g) => g.id === "years")?.options.map((o) => o.tenor)).not.toContain("1Y");
  });

  it("keeps favourites in place when the pinned group is disabled", () => {
    const groups = buildTenorGroups({
      tenors: DEFAULT_STANDARD_TENORS,
      favourites: ["3M"],
      showFavourites: false,
    });
    expect(groups.some((g) => g.id === "favourites")).toBe(false);
    const months = groups.find((g) => g.id === "months");
    expect(months?.options.find((o) => o.tenor === "3M")?.favourite).toBe(true);
  });

  it("respects hidden groups and custom order", () => {
    const groups = buildTenorGroups({
      tenors: DEFAULT_STANDARD_TENORS,
      hiddenGroups: ["overnight", "tomorrow", "spot"],
      groupOrder: ["years", "months", "weeks"],
    });
    expect(groups.map((g) => g.id)).toEqual(["years", "months", "weeks"]);
  });

  it("applies group label overrides", () => {
    const groups = buildTenorGroups({
      tenors: ["1M"],
      groupLabels: { months: "Monthly" },
    });
    expect(groups[0].label).toBe("Monthly");
  });

  it("marks disabled tenors", () => {
    const groups = buildTenorGroups({ tenors: ["1M", "2M"], disabledTenors: ["2M"] });
    const opts = groups[0].options;
    expect(opts.find((o) => o.tenor === "2M")?.disabled).toBe(true);
    expect(opts.find((o) => o.tenor === "1M")?.disabled).toBe(false);
  });

  it("filters by query and drops empty groups", () => {
    const groups = buildTenorGroups({ tenors: DEFAULT_STANDARD_TENORS, query: "Y" });
    const ids = groups.map((g) => g.id);
    expect(ids).toContain("years");
    expect(ids).not.toContain("weeks");
  });

  it("de-dupes repeated tenors", () => {
    const groups = buildTenorGroups({ tenors: ["1M", "1M", "2M"] });
    expect(groups[0].options.map((o) => o.tenor)).toEqual(["1M", "2M"]);
  });

  it("returns one flat group when grouped is false (favourites not lifted)", () => {
    const groups = buildTenorGroups({
      tenors: ["1M", "1Y", "ON"],
      grouped: false,
      favourites: ["1Y"],
    });
    expect(groups).toHaveLength(1);
    expect(groups[0].options.map((o) => o.tenor)).toEqual(["1M", "1Y", "ON"]);
    expect(groups[0].options.find((o) => o.tenor === "1Y")?.favourite).toBe(true);
  });

  it("returns [] for a flat list when the query matches nothing", () => {
    expect(buildTenorGroups({ tenors: ["1M"], grouped: false, query: "zzz" })).toEqual([]);
  });
});

describe("moveTenorHighlight", () => {
  const flat: TenorOptionModel[] = [
    { tenor: "1M", label: "1M", disabled: false, favourite: false, group: "months" },
    { tenor: "2M", label: "2M", disabled: true, favourite: false, group: "months" },
    { tenor: "3M", label: "3M", disabled: false, favourite: false, group: "months" },
  ];

  it("skips disabled options", () => {
    expect(moveTenorHighlight(flat, 0, 1)).toBe(2);
    expect(moveTenorHighlight(flat, 2, -1)).toBe(0);
  });

  it("wraps around the ends", () => {
    expect(moveTenorHighlight(flat, 2, 1)).toBe(0);
    expect(moveTenorHighlight(flat, 0, -1)).toBe(2);
  });

  it("returns -1 when empty", () => {
    expect(moveTenorHighlight([], -1, 1)).toBe(-1);
  });

  it("returns -1 when every option is disabled", () => {
    const allDisabled: TenorOptionModel[] = [
      { tenor: "1M", label: "1M", disabled: true, favourite: false, group: "months" },
    ];
    expect(moveTenorHighlight(allDisabled, 0, 1)).toBe(-1);
  });

  it("flattenGroups concatenates in render order", () => {
    const groups = buildTenorGroups({ tenors: ["1W", "1M"] });
    expect(flattenGroups(groups).map((o) => o.tenor)).toEqual(["1W", "1M"]);
  });
});
