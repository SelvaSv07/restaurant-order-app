import {
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";

export type PeriodPreset = "today" | "week" | "month" | "year" | "custom";

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function toISTDate(date: Date) {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

function fromISTDate(date: Date) {
  return new Date(date.getTime() - IST_OFFSET_MS);
}

export function resolvePresetRange(preset: Exclude<PeriodPreset, "custom">) {
  const zoned = toISTDate(new Date());

  if (preset === "today") {
    return {
      from: fromISTDate(startOfDay(zoned)),
      to: fromISTDate(endOfDay(zoned)),
    };
  }

  if (preset === "week") {
    return {
      from: fromISTDate(startOfDay(subDays(zoned, 6))),
      to: fromISTDate(endOfDay(zoned)),
    };
  }

  if (preset === "month") {
    return { from: fromISTDate(startOfMonth(zoned)), to: fromISTDate(endOfMonth(zoned)) };
  }

  return { from: fromISTDate(startOfYear(zoned)), to: fromISTDate(endOfYear(zoned)) };
}

/** Revenue / order charts: hourly for today (chart shows 12pm–12am only), daily otherwise, monthly for year. */
export function chartBucketForPreset(period: PeriodPreset): "hour" | "day" | "month" {
  if (period === "today") return "hour";
  if (period === "year") return "month";
  return "day";
}

export function resolvePreviousPresetRange(preset: Exclude<PeriodPreset, "custom">) {
  const zoned = toISTDate(new Date());

  if (preset === "today") {
    const prevDay = subDays(zoned, 1);
    return {
      from: fromISTDate(startOfDay(prevDay)),
      to: fromISTDate(endOfDay(prevDay)),
    };
  }

  if (preset === "week") {
    return {
      from: fromISTDate(startOfDay(subDays(zoned, 13))),
      to: fromISTDate(endOfDay(subDays(zoned, 7))),
    };
  }

  if (preset === "month") {
    const prev = subMonths(zoned, 1);
    return { from: fromISTDate(startOfMonth(prev)), to: fromISTDate(endOfMonth(prev)) };
  }

  const prevY = subYears(zoned, 1);
  return { from: fromISTDate(startOfYear(prevY)), to: fromISTDate(endOfYear(prevY)) };
}

export function resolvePreviousComparisonRange(
  period: PeriodPreset,
  from: Date,
  to: Date,
): { prevFrom: Date; prevTo: Date } {
  if (period === "custom") {
    const duration = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - duration);
    return { prevFrom, prevTo };
  }
  const p = resolvePreviousPresetRange(period);
  return { prevFrom: p.from, prevTo: p.to };
}

export function resolveCustomRange(fromDate: string, toDate: string) {
  const from = fromISTDate(startOfDay(toISTDate(parseISO(fromDate))));
  const to = fromISTDate(endOfDay(toISTDate(parseISO(toDate))));
  return { from, to };
}

export function toDateInput(date: Date) {
  return format(date, "yyyy-MM-dd");
}

