import {
  addDays,
  eachDayOfInterval,
  eachHourOfInterval,
  eachMonthOfInterval,
  format,
  startOfHour,
} from "date-fns";
import { TZDate } from "@date-fns/tz";

export type ChartBucket = "hour" | "day" | "month";

/** IST wall-clock hours to include on the chart (e.g. noon → 11pm for “12pm–12am” service window). */
export type HourChartWindow = {
  startHour: number;
  endHour: number;
  /** Extra tick for next calendar day `T00` (12 AM), usually with no data in “today” range. */
  appendNextDayMidnight?: boolean;
};

/** Noon through 11pm IST, plus 12 AM (next day midnight hour) on the axis. */
export const TODAY_CHART_HOUR_WINDOW: HourChartWindow = {
  startHour: 12,
  endHour: 23,
  appendNextDayMidnight: true,
};

/** Format `yyyy-MM-ddTHH` bucket keys using Asia/Kolkata (matches SQL grouping). */
export function formatIstHourBucketLabel(key: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(key)) return key;
  const [datePart, hourPart] = key.split("T");
  const h = hourPart.padStart(2, "0");
  const d = new Date(`${datePart}T${h}:00:00+05:30`);
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).formatToParts(d);
  const hour = parts.find((p) => p.type === "hour")?.value;
  const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value;
  if (hour != null && dayPeriod != null) {
    return `${hour} ${dayPeriod.toUpperCase()}`;
  }
  return key;
}

const IST = "Asia/Kolkata";

function mergeKeys(
  rows: { day: string; value: number }[],
  from: Date,
  to: Date,
  bucket: ChartBucket,
  hourWindow?: HourChartWindow,
): { day: string; value: number }[] {
  const map = new Map(rows.map((r) => [r.day, r.value]));
  const start = new TZDate(from.getTime(), IST);
  const end = new TZDate(to.getTime(), IST);
  if (bucket === "month") {
    const months = eachMonthOfInterval({ start, end });
    return months.map((d) => {
      const key = format(d, "yyyy-MM");
      return { day: key, value: map.get(key) ?? 0 };
    });
  }
  if (bucket === "hour") {
    if (hourWindow) {
      const dateStr = format(start, "yyyy-MM-dd");
      const out: { day: string; value: number }[] = [];
      for (let h = hourWindow.startHour; h <= hourWindow.endHour; h++) {
        const key = `${dateStr}T${String(h).padStart(2, "0")}`;
        out.push({ day: key, value: map.get(key) ?? 0 });
      }
      if (hourWindow.appendNextDayMidnight) {
        const nextDayStr = format(addDays(start, 1), "yyyy-MM-dd");
        const midnightKey = `${nextDayStr}T00`;
        out.push({ day: midnightKey, value: map.get(midnightKey) ?? 0 });
      }
      return out;
    }
    const hourStart = startOfHour(start);
    const hourEnd = startOfHour(end);
    const hours = eachHourOfInterval({ start: hourStart, end: hourEnd });
    return hours.map((d) => {
      const key = format(d, "yyyy-MM-dd'T'HH");
      return { day: key, value: map.get(key) ?? 0 };
    });
  }
  const days = eachDayOfInterval({ start, end });
  return days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    return { day: key, value: map.get(key) ?? 0 };
  });
}

export function mergeRevenueChart(
  rows: { day: string; totalRupee: number }[],
  from: Date,
  to: Date,
  bucket: ChartBucket,
  hourWindow?: HourChartWindow,
): { day: string; totalRupee: number }[] {
  const normalized = rows.map((r) => ({
    day: r.day,
    value: Number(r.totalRupee),
  }));
  return mergeKeys(normalized, from, to, bucket, hourWindow).map((r) => ({
    day: r.day,
    totalRupee: r.value,
  }));
}

export function mergeCountSeries(
  rows: { day: string; count: number }[],
  from: Date,
  to: Date,
  bucket: ChartBucket,
  hourWindow?: HourChartWindow,
): { day: string; count: number }[] {
  const normalized = rows.map((r) => ({
    day: r.day,
    value: Number(r.count),
  }));
  return mergeKeys(normalized, from, to, bucket, hourWindow).map((r) => ({
    day: r.day,
    count: r.value,
  }));
}
