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
    const month: string = format(date, "MMMM yyyy"); // Get the month name with year (e.g., "November 2024")
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
