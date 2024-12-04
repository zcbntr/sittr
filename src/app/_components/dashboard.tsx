/* displays big calender, overview of upcoming sittings, 
recent sittings, ability to create sittings (if owner),
ability to satisfy sitting requests (if sitter) */

import CalendarComponent from "~/components/calendar";
import { Button } from "~/components/ui/button";
import CreateTaskDialog from "./tasks/createtaskdialog";
import { getGroupsUserIsIn } from "~/server/queries/groups";
import { auth } from "@clerk/nextjs/server";
import { getTasksInRange } from "~/server/queries/tasks";
import type { TaskTypeEnum } from "~/lib/schemas/tasks";
import TaskTypeSelect from "./dashboard/tasks-type-select";
import { Suspense } from "react";
import MonthArrows from "./dashboard/month-arrows";
import { MdAddTask } from "react-icons/md";

export default async function Dashboard({
  dateFrom,
  dateTo,
  tasksType,
}: {
  dateFrom: Date;
  dateTo: Date;
  tasksType: TaskTypeEnum;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const [groups, tasks] = await Promise.all([
    getGroupsUserIsIn(),
    getTasksInRange(dateFrom, dateTo, tasksType),
  ]);

  return (
    <div className="flex flex-col gap-3 p-5">
      <h1 className="text-xl">Dashboard</h1>
      <section>
        <div className="flex flex-row flex-wrap place-content-center sm:place-content-end gap-2">
          <div className="flex flex-col place-content-center">
            <CreateTaskDialog groups={groups}>
              <Button variant="outline">
                <MdAddTask className="h-4 w-4" />
              </Button>
            </CreateTaskDialog>
          </div>

          <div className="flex flex-col place-content-center">
            <TaskTypeSelect initialType={tasksType} />
          </div>

          <div className="flex flex-col place-content-center">
            <MonthArrows from={dateFrom} to={dateTo} />
          </div>
        </div>
      </section>
      <section>
        <Suspense
          key={dateFrom.toString() + dateTo.toString() + tasksType}
          fallback={<div>Loading table...</div>}
        >
          <div className="pb-5">
            <CalendarComponent userId={userId} groups={groups} tasks={tasks} />
          </div>
        </Suspense>
      </section>
    </div>
  );
}
