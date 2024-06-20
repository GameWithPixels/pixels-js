import { MaterialCommunityIcons } from "@expo/vector-icons";
import { assertNever } from "@systemic-games/pixels-core-utils";
import {
  PixelColorway,
  PixelColorwayValues,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";

import { ProfileDieTypes } from "./ProfileDieTypes";
import { getColorwayLabel, getProfileDieTypeLabel } from "./descriptions";
import { AvailableDiceTypes } from "../dice/AvailableDiceTypes";

import SortAZIcon from "#/icons/items-view/sort-a-z";
import SortZAIcon from "#/icons/items-view/sort-z-a";
import { PairedDie } from "~/app/PairedDie";

function SortByDateDescendingIcon({
  size,
  color,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <MaterialCommunityIcons
      name="sort-calendar-descending"
      size={size}
      color={color}
    />
  );
}

function SortByDateAscendingIcon({
  size,
  color,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <MaterialCommunityIcons
      name="sort-calendar-ascending"
      size={size}
      color={color}
    />
  );
}

export const SortModeList = [
  "alphabetical",
  "alphabetical-reverse",
  "chronological",
  "chronological-reverse",
] as const;

export type SortMode = (typeof SortModeList)[number];

export function getSortModeLabel(sortMode: SortMode): string {
  switch (sortMode) {
    case "alphabetical":
      return "Alphabetical";
    case "alphabetical-reverse":
      return "Reverse Alphabetical";
    case "chronological":
      return "Chronological";
    case "chronological-reverse":
      return "Reverse Chronological";
    default:
      assertNever(sortMode, `No label for sort mode ${sortMode}`);
  }
}

export function getSortModeIcon(
  sortMode: SortMode
): (props: { size: number; color: string }) => React.ReactNode {
  switch (sortMode) {
    case "alphabetical":
      return SortAZIcon;
    case "alphabetical-reverse":
      return SortZAIcon;
    case "chronological":
      return SortByDateDescendingIcon;
    case "chronological-reverse":
      return SortByDateAscendingIcon;
    default:
      assertNever(sortMode, `No icon for sort mode ${sortMode}`);
  }
}

export const DiceGroupingList = ["none", "dieType", "colorway"] as const;

export type DiceGrouping = (typeof DiceGroupingList)[number];

export function getDiceGroupingLabel(grouping: DiceGrouping): string {
  switch (grouping) {
    case "none":
      return "None";
    case "dieType":
      return "Die Type";
    case "colorway":
      return "Colorway";
    default:
      assertNever(grouping, `No label for grouping ${grouping}`);
  }
}

// TODO keyof Profiles.Profile
export const ProfilesGroupingList = [
  "none",
  "dieType",
  "creationDate",
  "lastModified",
] as const;

export type ProfilesGrouping = (typeof ProfilesGroupingList)[number];

export function getProfilesGroupingLabel(grouping: ProfilesGrouping): string {
  switch (grouping) {
    case "none":
      return "None";
    case "dieType":
      return "Die Type";
    case "creationDate":
      return "Creation Date";
    case "lastModified":
      return "Last Modification Date";
    default:
      assertNever(grouping, `No label for grouping ${grouping}`);
  }
}

// TODO keyof Profiles.Animation
export const AnimationsGroupingList = ["none", "type", "duration"] as const;

export type AnimationsGrouping = (typeof AnimationsGroupingList)[number];

export function getAnimationsGroupingLabel(
  grouping: AnimationsGrouping
): string {
  switch (grouping) {
    case "none":
      return "None";
    case "type":
      return "Animation Type";
    case "duration":
      return "Duration";
    default:
      assertNever(grouping, `No label for grouping ${grouping}`);
  }
}

export function sortProfiles(
  profiles: readonly Readonly<Profiles.Profile>[],
  sortMode?: SortMode
): Readonly<Profiles.Profile>[] {
  const sorted = [...profiles];
  if (!sortMode) {
    return sorted;
  }
  switch (sortMode) {
    case "alphabetical":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "alphabetical-reverse":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "chronological":
      return sorted.sort(
        (a, b) => a.creationDate.getTime() - b.creationDate.getTime()
      );
    case "chronological-reverse":
      return sorted.sort(
        (a, b) => b.creationDate.getTime() - a.creationDate.getTime()
      );
    default:
      assertNever(sortMode, `No sorting for ${sortMode}`);
  }
}

const noDateObject = new Date(0);

export function groupByTime<T extends { name: string }>(
  items: { date: Date; value: T }[]
): {
  title: string;
  values: T[];
}[] {
  const aDay = 24 * 60 * 60 * 1000;
  const now = new Date();
  const date = now.getDate();
  const day = now.getDay();
  const month = now.getMonth();
  const year = now.getFullYear();
  const todayStart = new Date(year, month, date).getTime();

  items.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  const groups = [] as {
    title: string;
    values: T[];
  }[];
  const iMax = items.length;
  let i = 0;

  {
    const futureObj = {
      title: "In The Future",
      values: [] as T[],
    };
    const time = now.getTime();
    while (i < iMax && items[i].date.getTime() > time) {
      futureObj.values.push(items[i++].value);
    }
    if (futureObj.values.length) {
      groups.push(futureObj);
    }
  }
  if (i < iMax) {
    const todayObj = {
      title: "Today",
      values: [] as T[],
    };
    while (i < iMax && items[i].date.getTime() >= todayStart) {
      todayObj.values.push(items[i++].value);
    }
    if (todayObj.values.length) {
      groups.push(todayObj);
    }
  }
  if (day > 1 && i < iMax) {
    const yesterdayObj = {
      title: "Yesterday",
      values: [] as T[],
    };
    const yesterday = todayStart - aDay;
    while (i < iMax && items[i].date.getTime() >= yesterday) {
      yesterdayObj.values.push(items[i++].value);
    }
    if (yesterdayObj.values.length) {
      groups.push(yesterdayObj);
    }
  }
  if (day > 2 && i < iMax) {
    const weekObj = {
      title: "This Week",
      values: [] as T[],
    };
    const weekStart = todayStart - day * aDay;
    while (i < iMax && items[i].date.getTime() >= weekStart) {
      weekObj.values.push(items[i++].value);
    }
    if (weekObj.values.length) {
      groups.push(weekObj);
    }
  }
  if (i < iMax) {
    const lastWeekObj = {
      title: "Last Week",
      values: [] as T[],
    };
    const lastWeekStart = todayStart - (7 + day) * aDay;
    while (i < iMax && items[i].date.getTime() >= lastWeekStart) {
      lastWeekObj.values.push(items[i++].value);
    }
    if (lastWeekObj.values.length) {
      groups.push(lastWeekObj);
    }
  }
  if (i < iMax) {
    const monthObj = {
      title: "Earlier This Month",
      values: [] as T[],
    };
    const monthStart = new Date(year, month).getTime();
    while (i < iMax && items[i].date.getTime() >= monthStart) {
      monthObj.values.push(items[i++].value);
    }
    if (monthObj.values.length) {
      groups.push(monthObj);
    }
  }
  if (i < iMax) {
    const lastMonthObj = {
      title: "Last Month",
      values: [] as T[],
    };
    const lastMonth = month === 0 ? 11 : month - 1;
    const yearLastMonth = month === 0 ? year - 1 : year;
    const lastMonthStart = new Date(yearLastMonth, lastMonth).getTime();
    while (i < iMax && items[i].date.getTime() >= lastMonthStart) {
      lastMonthObj.values.push(items[i++].value);
    }
    if (lastMonthObj.values.length) {
      groups.push(lastMonthObj);
    }
  }
  if (month > 1 && i < iMax) {
    const yearObj = {
      title: "Earlier This Year",
      values: [] as T[],
    };
    const yearStart = new Date(year, 0, 1).getTime();
    while (i < iMax && items[i].date.getTime() >= yearStart) {
      yearObj.values.push(items[i++].value);
    }
    if (yearObj.values.length) {
      groups.push(yearObj);
    }
  }
  if (i < iMax) {
    const lastYearObj = {
      title: "Last Year",
      values: [] as T[],
    };
    const lastYearStart = new Date(year - 1, 0, 1).getTime();
    while (i < iMax && items[i].date.getTime() > +lastYearStart) {
      lastYearObj.values.push(items[i++].value);
    }
    if (lastYearObj.values.length) {
      groups.push(lastYearObj);
    }
  }
  if (i < iMax) {
    const pastYearsObj = {
      title: "Past Years",
      values: [] as T[],
    };
    while (i < iMax && items[i].date !== noDateObject) {
      pastYearsObj.values.push(items[i++].value);
    }
    if (pastYearsObj.values.length) {
      groups.push(pastYearsObj);
    }
  }
  if (i < iMax) {
    const neverYearsObj = {
      title: "Never",
      values: [] as T[],
    };
    while (i < iMax) {
      neverYearsObj.values.push(items[i++].value);
    }
    groups.push(neverYearsObj);
  }
  return groups;
}

function sortGroupedByTime<T extends { name: string }>(
  groups: readonly Readonly<{
    title: string;
    values: Readonly<T>[];
  }>[],
  sortMode?: SortMode
): {
  title: string;
  values: Readonly<T>[];
}[] {
  switch (sortMode) {
    case "alphabetical":
      return groups.map(({ title, values }) => ({
        title,
        values: values.sort((a, b) => a.name.localeCompare(b.name)),
      }));
    case "alphabetical-reverse":
      return groups.map(({ title, values }) => ({
        title,
        values: values.sort((a, b) => b.name.localeCompare(a.name)),
      }));
    case undefined:
    case "chronological-reverse":
      return [...groups];
    case "chronological": {
      const sorted = [...groups].reverse();
      for (const { values } of groups) {
        values.reverse();
      }
      return sorted;
    }
    default:
      assertNever(sortMode, `No sorting for ${sortMode}`);
  }
}

export function groupAndSortProfiles(
  profiles: readonly Readonly<Profiles.Profile>[],
  groupBy?: ProfilesGrouping,
  sortMode?: SortMode
): {
  title: string;
  values: Readonly<Profiles.Profile>[];
}[] {
  const defaultTitle = "Profiles";
  if (!groupBy && !sortMode) {
    return [{ title: defaultTitle, values: [...profiles] }];
  } else {
    const sort = (profiles: readonly Readonly<Profiles.Profile>[]) =>
      sortProfiles(profiles, sortMode);
    switch (groupBy) {
      case undefined:
        return [{ title: defaultTitle, values: sort(profiles) }];
      case "none":
        return [{ title: defaultTitle, values: sort(profiles) }];
      case "dieType":
        return ProfileDieTypes.map((dieType) => ({
          title: getProfileDieTypeLabel(dieType),
          values: sort(profiles.filter((p) => p.dieType === dieType)),
        })).filter((group) => group.values.length > 0);
      case "creationDate":
        return sortGroupedByTime(
          groupByTime(
            profiles.map((p) => ({
              date: p.creationDate,
              value: p,
            }))
          ),
          sortMode
        );
      case "lastModified":
        return sortGroupedByTime(
          groupByTime(
            profiles.map((p) => ({
              date: p.lastModified,
              value: p,
            }))
          ),
          sortMode
        );
      default:
        assertNever(groupBy, `No grouping for ${groupBy}`);
    }
  }
}

export function sortDice(
  dice: readonly PairedDie[],
  sortMode?: SortMode
): PairedDie[] {
  const sorted = [...dice];
  if (!sortMode) {
    return sorted;
  }
  switch (sortMode) {
    case "alphabetical":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "alphabetical-reverse":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "chronological":
      return sorted;
    case "chronological-reverse":
      return sorted.reverse();
    default:
      assertNever(sortMode, `No sorting for ${sortMode}`);
  }
}

export function groupAndSortDice(
  dice: readonly PairedDie[],
  groupBy?: DiceGrouping,
  sortMode?: SortMode
): {
  title: string;
  values: PairedDie[];
}[] {
  const defaultTitle = "Dice";
  if (!groupBy && !sortMode) {
    return [{ title: defaultTitle, values: [...dice] }];
  } else {
    const sort = (dice: readonly PairedDie[]) => sortDice(dice, sortMode);
    switch (groupBy) {
      case undefined:
        return [{ title: defaultTitle, values: sort(dice) }];
      case "none":
        return [{ title: defaultTitle, values: sort(dice) }];
      case "dieType":
        return AvailableDiceTypes.map((dieType) => ({
          title: getProfileDieTypeLabel(dieType),
          values: sort(dice.filter((p) => p.dieType === dieType)),
        })).filter((group) => group.values.length > 0);
      case "colorway":
        return (Object.keys(PixelColorwayValues) as PixelColorway[])
          .map((colorway) => ({
            title: getColorwayLabel(colorway),
            values: sort(dice.filter((p) => p.colorway === colorway)),
          }))
          .filter((group) => group.values.length > 0);
      default:
        assertNever(groupBy, `No grouping for ${groupBy}`);
    }
  }
}
