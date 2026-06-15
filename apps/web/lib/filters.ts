import { subDays } from "date-fns";
import type { Change, ChangeType, TimeRange } from "./types";
import { TIME_RANGE_OPTIONS } from "./types";

export function getRangeStart(range: TimeRange): Date {
  const option = TIME_RANGE_OPTIONS.find((item) => item.value === range);
  const days = option?.days ?? 7;
  return subDays(new Date(), days);
}

export function filterChangesByRange(changes: Change[], range: TimeRange): Change[] {
  const start = getRangeStart(range);
  return changes.filter((change) => new Date(change.detected_date) >= start);
}

export function filterChangesBySearch(changes: Change[], search: string): Change[] {
  const query = search.trim().replace(/^@/, "").toLowerCase();
  if (!query) {
    return changes;
  }
  return changes.filter((change) => change.target_username.toLowerCase().includes(query));
}

export function countChangesByType(changes: Change[]) {
  return changes.reduce(
    (acc, change) => {
      acc[change.change_type as ChangeType] += 1;
      return acc;
    },
    {
      started_following: 0,
      stopped_following: 0,
      gained_follower: 0,
      lost_follower: 0,
    }
  );
}

export function groupChangesByDate(changes: Change[]) {
  return changes.reduce<Record<string, Change[]>>((acc, change) => {
    const key = change.detected_date;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(change);
    return acc;
  }, {});
}
