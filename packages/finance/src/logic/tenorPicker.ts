import { parseTenorInput, type TenorInputParser } from "../utils/tenor";

//  Groups

/** Semantic buckets a tenor can fall into. */
export type TenorGroupId =
  "favourites" | "overnight" | "tomorrow" | "spot" | "weeks" | "months" | "years" | "custom";

/** Default group render order (favourites is pinned separately, always first). */
export const DEFAULT_TENOR_GROUP_ORDER: TenorGroupId[] = [
  "overnight",
  "tomorrow",
  "spot",
  "weeks",
  "months",
  "years",
  "custom",
];

/** Default human-readable group headings. */
export const DEFAULT_TENOR_GROUP_LABELS: Record<TenorGroupId, string> = {
  favourites: "Favourites",
  overnight: "Overnight",
  tomorrow: "Tomorrow",
  spot: "Spot",
  weeks: "Weeks",
  months: "Months",
  years: "Years",
  custom: "Custom",
};

/** JIRA-specified default market tenor set. */
export const DEFAULT_STANDARD_TENORS = [
  "ON",
  "TN",
  "SN",
  "1W",
  "2W",
  "3W",
  "1M",
  "2M",
  "3M",
  "6M",
  "9M",
  "1Y",
  "18M",
  "2Y",
  "5Y",
  "10Y",
] as const;

/**
 * Classify a canonical tenor into its home group. Single-unit weeks/months/years
 * map to their named group; specials map by code; everything else (plain days,
 * compound tenors) is Custom.
 */
export function classifyTenor(
  tenor: string,
  parser: TenorInputParser = parseTenorInput,
): TenorGroupId {
  const parsed = parser(tenor);
  if (!parsed.valid) return "custom";
  if (parsed.special === "ON") return "overnight";
  if (parsed.special === "TN") return "tomorrow";
  if (parsed.special === "SN" || parsed.special === "SW") return "spot";
  if (parsed.terms && parsed.terms.length === 1) {
    switch (parsed.terms[0].unit) {
      case "W":
        return "weeks";
      case "M":
        return "months";
      case "Y":
        return "years";
      default:
        return "custom";
    }
  }
  return "custom";
}

//  Models

export interface TenorOptionModel {
  /** Canonical tenor string. */
  tenor: string;
  /** Display label (defaults to the canonical tenor). */
  label: string;
  /** Cannot be selected. */
  disabled: boolean;
  /** Currently favourited. */
  favourite: boolean;
  /** Home group. */
  group: TenorGroupId;
}

export interface TenorGroupModel {
  id: TenorGroupId;
  label: string;
  options: TenorOptionModel[];
}

export interface BuildTenorGroupsParams {
  /** Tenors to show (canonical strings). */
  tenors: readonly string[];
  /** Optional per-tenor display labels. */
  labels?: Record<string, string>;
  /** Tenors that cannot be selected. */
  disabledTenors?: readonly string[];
  /** Favourited tenors (canonical). */
  favourites?: readonly string[];
  /** Whether to surface a pinned Favourites group. */
  showFavourites?: boolean;
  /** Group render order. Defaults to {@link DEFAULT_TENOR_GROUP_ORDER}. */
  groupOrder?: readonly TenorGroupId[];
  /** Groups to hide entirely. */
  hiddenGroups?: readonly TenorGroupId[];
  /** Group heading overrides. */
  groupLabels?: Partial<Record<TenorGroupId, string>>;
  /** Case-insensitive substring filter against tenor + label. */
  query?: string;
  /** Replaceable parser used for classification. */
  parser?: TenorInputParser;
  /** When false, return one flat, ungrouped list (favourites not lifted). Default true. */
  grouped?: boolean;
}

function matchesQuery(option: TenorOptionModel, needle: string): boolean {
  if (!needle) return true;
  const q = needle.toUpperCase();
  return option.tenor.toUpperCase().includes(q) || option.label.toUpperCase().includes(q);
}

/**
 * Build the grouped option model for the picker popup. Favourited tenors are
 * lifted into a pinned Favourites group (removed from their home group) so the
 * favourite state is both visually distinct and reorderable. Empty groups and
 * hidden groups are dropped.
 */
export function buildTenorGroups(params: BuildTenorGroupsParams): TenorGroupModel[] {
  const {
    tenors,
    labels,
    disabledTenors = [],
    favourites = [],
    showFavourites = true,
    groupOrder = DEFAULT_TENOR_GROUP_ORDER,
    hiddenGroups = [],
    groupLabels,
    query = "",
    parser = parseTenorInput,
    grouped = true,
  } = params;

  const disabledSet = new Set(disabledTenors);
  const favouriteSet = new Set(favourites);
  const hiddenSet = new Set(hiddenGroups);
  const needle = query.trim();

  const labelFor = (id: TenorGroupId): string =>
    groupLabels?.[id] ?? DEFAULT_TENOR_GROUP_LABELS[id];

  const toOption = (tenor: string): TenorOptionModel => ({
    tenor,
    label: labels?.[tenor] ?? tenor,
    disabled: disabledSet.has(tenor),
    favourite: favouriteSet.has(tenor),
    group: classifyTenor(tenor, parser),
  });

  // De-dupe while preserving order.
  const seen = new Set<string>();
  const options: TenorOptionModel[] = [];
  for (const tenor of tenors) {
    if (seen.has(tenor)) continue;
    seen.add(tenor);
    options.push(toOption(tenor));
  }

  // Flat mode: one ungrouped list in original order (favourites kept in place).
  if (!grouped) {
    const flatOptions = options.filter((o) => matchesQuery(o, needle));
    return flatOptions.length > 0 ? [{ id: "custom", label: "", options: flatOptions }] : [];
  }

  const groups: TenorGroupModel[] = [];

  // Pinned favourites group (in list order), only when enabled + non-empty.
  if (showFavourites && !hiddenSet.has("favourites")) {
    const favOptions = options.filter((o) => o.favourite && matchesQuery(o, needle));
    if (favOptions.length > 0) {
      groups.push({ id: "favourites", label: labelFor("favourites"), options: favOptions });
    }
  }

  const favouritesLifted = showFavourites;

  for (const id of groupOrder) {
    if (id === "favourites" || hiddenSet.has(id)) continue;
    const groupOptions = options.filter(
      (o) => o.group === id && !(favouritesLifted && o.favourite) && matchesQuery(o, needle),
    );
    if (groupOptions.length > 0) {
      groups.push({ id, label: labelFor(id), options: groupOptions });
    }
  }

  return groups;
}

/** Flatten grouped options into render order (used for roving highlight). */
export function flattenGroups(groups: readonly TenorGroupModel[]): TenorOptionModel[] {
  return groups.flatMap((g) => g.options);
}

/**
 * Move the roving highlight over the flat option list, skipping disabled
 * options. Wraps at both ends. Returns -1 when there is nothing selectable.
 */
export function moveTenorHighlight(
  flat: readonly TenorOptionModel[],
  current: number,
  direction: 1 | -1,
): number {
  const count = flat.length;
  if (count === 0) return -1;
  let next = current;
  for (let step = 0; step < count; step++) {
    next = (next + direction + count) % count;
    if (!flat[next].disabled) return next;
  }
  return current >= 0 && current < count && !flat[current].disabled ? current : -1;
}
