import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  eachDayOfInterval,
  format,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type MonthCounts = Record<string, number>;
export function getDominantMonth(startDate: Date, endDate: Date): string {
  // Generate all dates in the range
  const allDates: Date[] = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  // Create a map to count days in each month
  const monthCounts: MonthCounts = {};

  allDates.forEach((date) => {
    const month: string = format(date, "MMM yyyy"); // Get the month name with year (e.g., "November 2024")
    monthCounts[month] = (monthCounts[month] ?? 0) + 1;
  });

  // Find the month with the most days
  let dominantMonth = "";
  let maxDays = 0;

  for (const [month, count] of Object.entries(monthCounts)) {
    if (count > maxDays) {
      dominantMonth = month;
      maxDays = count;
    }
  }

  return dominantMonth;
}

export function getPetAgeString(dob: Date): string {
  const today = new Date();

  const days = differenceInDays(today, dob);
  if (days < 30) {
    return `${days} day${days !== 1 ? "s" : ""}`;
  }

  const months = differenceInMonths(today, dob);
  if (months < 18) {
    return `${months} month${months !== 1 ? "s" : ""}`;
  }

  const years = differenceInYears(today, dob);
  return `${years} year${years !== 1 ? "s" : ""}`;
}

export function getTimeSinceDateAsString(date: Date) {
  const now = new Date();
  const diff = differenceInDays(now, date);

  if (diff < 1) {
    // Calculate hours
    const hours = Math.floor((now.getTime() - date.getTime()) / 1000 / 60 / 60);
    if (hours < 1) {
      // Calculate minutes
      const minutes = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
      if (minutes < 1) {
        return "Now";
      }

      // Minutes ago
      return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
    }

    // Hours ago
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }

  // Yesterday and time
  if (diff < 2) {
    return `Yesterday ${format(date, "h:mm a")}`;
  }

  // Day and time
  if (diff < 7) {
    return `${format(date, "EEEE h:mm a")}`;
  }

  // Days ago
  return `${diff} days ago`;
}

export function convertToSubCurrency(amount: number, factor = 100): number {
  return Math.round(amount * factor);
}

export function randomString(length: number, chars: string) {
  var mask = "";
  if (chars.indexOf("a") > -1) mask += "abcdefghijklmnopqrstuvwxyz";
  if (chars.indexOf("A") > -1) mask += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (chars.indexOf("#") > -1) mask += "0123456789";
  if (chars.indexOf("!") > -1) mask += "~`!@#$%^&*()_+-={}[]:\";'<>?,./|\\";
  var result = "";
  for (var i = length; i > 0; --i)
    result += mask[Math.floor(Math.random() * mask.length)];
  return result;
}
