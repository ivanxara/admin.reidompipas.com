import { dates } from "@/utils/generic";

const LISBON_TIME_ZONE = "Europe/Lisbon";
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export type StoryMenuItem = {
  id: number;
  name: string;
  categoryId: number | null;
  order: number | null;
  special: boolean;
  everyday: boolean;
};

export function currentLisbonDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LISBON_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function nextLisbonDate() {
  const [year, month, day] = currentLisbonDate().split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));

  return [
    nextDate.getUTCFullYear(),
    String(nextDate.getUTCMonth() + 1).padStart(2, "0"),
    String(nextDate.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function parseStoryDate(value: string | null) {
  const dateValue = value ?? nextLisbonDate();
  const match = DATE_PATTERN.exec(dateValue);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12);

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return {
    value: dateValue,
    date,
    label: dates.getDateExtensive(date),
    filename: `diarias-${day}-${month}-${year}.png`,
  };
}

export function sortStoryItems(items: StoryMenuItem[]) {
  return [...items].sort((left, right) => {
    const leftPriority = left.categoryId === 14 ? 2 : left.everyday ? 1 : 0;
    const rightPriority = right.categoryId === 14 ? 2 : right.everyday ? 1 : 0;

    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    const categoryDifference =
      (left.categoryId ?? Number.MAX_SAFE_INTEGER) -
      (right.categoryId ?? Number.MAX_SAFE_INTEGER);
    if (categoryDifference !== 0) return categoryDifference;

    const orderDifference =
      (left.order ?? Number.MAX_SAFE_INTEGER) -
      (right.order ?? Number.MAX_SAFE_INTEGER);
    if (orderDifference !== 0) return orderDifference;

    return left.id - right.id;
  });
}
