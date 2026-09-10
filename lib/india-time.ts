import { julDay, revJul } from "@typescriptify/sweph/dist/swedate.js";
import { SE_GREG_CAL } from "@typescriptify/sweph/dist/constants.js";

export const INDIA_UTC_OFFSET_MINUTES = 330;

export type IndiaLocalDateTime = {
  date: string;
  time: string;
  minutes: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

export function isoDateFromParts(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function indiaCivilDayStartJulian(year: number, month: number, day: number) {
  return julDay(year, month, day, 0, SE_GREG_CAL) - INDIA_UTC_OFFSET_MINUTES / 1440;
}

export function indiaLocalPartsFromJulian(jd: number): IndiaLocalDateTime {
  const value = revJul(jd, SE_GREG_CAL);
  const rawMinutes = value.hour * 60 + INDIA_UTC_OFFSET_MINUTES;
  let localDayOffset = Math.floor(rawMinutes / 1440);
  let minutes = Math.round(rawMinutes - localDayOffset * 1440);

  if (minutes >= 1440) {
    minutes -= 1440;
    localDayOffset += 1;
  } else if (minutes < 0) {
    minutes += 1440;
    localDayOffset -= 1;
  }

  const localDate = new Date(Date.UTC(value.year, value.month - 1, value.day, 12));
  localDate.setUTCDate(localDate.getUTCDate() + localDayOffset);

  return {
    date: isoDateFromParts(localDate.getUTCFullYear(), localDate.getUTCMonth() + 1, localDate.getUTCDate()),
    time: `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`,
    minutes,
  };
}

export function addIsoDays(dateIso: string, days: number) {
  const date = new Date(`${dateIso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDateFromParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function isoDateParts(dateIso: string) {
  const [year, month, day] = dateIso.split("-").map(Number);
  return { year, month, day };
}

const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDatedTime(time: string, eventDate: string | null | undefined, baseDate: string) {
  if (time === "—" || !eventDate || eventDate === baseDate) return time;
  const event = isoDateParts(eventDate);
  const base = isoDateParts(baseDate);
  const year = event.year === base.year ? "" : ` ${event.year}`;
  return `${time} · ${event.day} ${shortMonths[event.month - 1]}${year}`;
}
