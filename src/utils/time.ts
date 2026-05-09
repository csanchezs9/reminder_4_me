import { DateTime } from "luxon";
import { logger } from "./logger";

const DEFAULT_TIMEZONE = process.env.TIMEZONE || "America/Bogota";

export function getTimeZone(): string {
  return DEFAULT_TIMEZONE;
}

export function formatDateTime(date: Date, tz = getTimeZone()): string {
  return DateTime.fromJSDate(date).setZone(tz).toFormat("ccc, LLL dd HH:mm");
}

export function getDayRange(offsetDays: number, tz = getTimeZone()): { start: Date; end: Date } {
  const start = DateTime.now().setZone(tz).startOf("day").plus({ days: offsetDays });
  const end = start.endOf("day");
  return { start: start.toJSDate(), end: end.toJSDate() };
}

export function getDailySummaryTime(): { hour: number; minute: number } {
  const raw = process.env.DAILY_SUMMARY_TIME || "20:00";
  const parts = raw.split(":");
  const hour = Number.parseInt(parts[0] ?? "20", 10);
  const minute = Number.parseInt(parts[1] ?? "0", 10);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    logger.warn("Invalid DAILY_SUMMARY_TIME, falling back to 20:00");
    return { hour: 20, minute: 0 };
  }

  return { hour, minute };
}

export function getListSummaryIntervalHours(): number | null {
  const raw = process.env.LIST_SUMMARY_INTERVAL_HOURS || "4";
  const hours = Number.parseInt(raw, 10);

  if (Number.isNaN(hours) || hours < 0 || hours > 24) {
    logger.warn("Invalid LIST_SUMMARY_INTERVAL_HOURS, falling back to 4");
    return 4;
  }

  if (hours === 0) {
    return null;
  }

  return hours;
}
