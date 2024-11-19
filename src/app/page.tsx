import { SignedIn, SignedOut } from "@clerk/nextjs";
import Dashboard from "./_components/dashboard";
import Home from "./_components/homepage";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { TaskTypeEnum } from "~/lib/schemas/tasks";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { from, to, type } = await searchParams;

  // Safely convert the date strings to Date objects.
  // If they are not specified, default to the start and end of calendar month page.
  const dateFromValidated = from
    ? new Date(from as string)
    : startOfWeek(startOfMonth(new Date()));
  const dateToValidated = to
    ? new Date(to as string)
    : endOfWeek(endOfMonth(new Date()));
  const tasksTypeValidated = type
    ? (type as TaskTypeEnum)
    : TaskTypeEnum.Values.All;

  return (
    <>
      <SignedIn>
        <Dashboard
          dateFrom={dateFromValidated}
          dateTo={dateToValidated}
          tasksType={tasksTypeValidated}
        />
      </SignedIn>
      <SignedOut>
        <Home />
      </SignedOut>
    </>
  );
}
