import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getKSTDate(date: Date = new Date()) {
  try {
    return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  } catch (e) {
    // Fallback if Intl is not supported or fails
    return new Date(date.getTime() + (9 * 60 * 60 * 1000));
  }
}

export function getKSTRange(date: Date) {
  const kst = getKSTDate(date);
  const year = kst.getFullYear();
  const month = kst.getMonth();
  const day = kst.getDate();

  // KST 00:00:00 is UTC-9 hours from the perspective of a Date.UTC call with KST numbers
  const start = new Date(Date.UTC(year, month, day, 0, 0, 0) - (9 * 60 * 60 * 1000));
  const end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - (9 * 60 * 60 * 1000));

  return { start, end };
}
