import { auth } from "~/auth";
import { TaskTypeEnum } from "~/lib/schemas";
import Dashboard from "./_components/dashboard";
import Home from "./_components/homepage";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { getBasicLoggedInUser } from "~/server/queries/users";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { from, to, type } = await searchParams;

  const session = await auth();

  if (!session?.user?.email) return <Home />;

  const user = await getBasicLoggedInUser();

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

  if (user)
    return (
      <Dashboard
        dateFrom={dateFromValidated}
        dateTo={dateToValidated}
        tasksType={tasksTypeValidated}
      />
    );
  else return <Home />;
}
