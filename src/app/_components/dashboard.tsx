/* displays big calender, overview of upcoming sittings, 
recent sittings, ability to create sittings (if owner),
ability to satisfy sitting requests (if sitter) */

import CalendarComponent from "~/components/calendar";
import { Button } from "~/components/ui/button";
import CreatePetDialog from "./pets/createpetdialog";
import CreateGroupDialog from "./groups/creategroupdialog";
import CreateTaskDialog from "./tasks/createtaskdialog";
import { getGroupsUserIsIn } from "~/server/queries/groups";
import { auth } from "@clerk/nextjs/server";
import { getTasksInRange } from "~/server/queries/tasks";
import type { TaskTypeEnum } from "~/lib/schemas/tasks";
import TaskTypeSelect from "./dashboard/tasks-type-select";
import { Suspense } from "react";
import MonthArrows from "./dashboard/month-arrows";

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
        <div className="flex flex-row flex-wrap gap-3">
          <div className="flex flex-col place-content-center">
            <CreateTaskDialog groups={groups}>
              <Button variant="outline">New Task</Button>
            </CreateTaskDialog>
          </div>

          <div className="flex flex-col place-content-center">
            <CreatePetDialog>
              <Button variant="outline">New Pet</Button>
            </CreatePetDialog>
          </div>

          <div className="flex flex-col place-content-center">
            <CreateGroupDialog>
              <Button variant="outline">New Group</Button>
            </CreateGroupDialog>
          </div>

          <div className="flex flex-col place-content-center">
            <TaskTypeSelect initialType={tasksType} />
          </div>

          <div className="flex flex-col place-content-center">
            <MonthArrows initialFrom={dateFrom} initialTo={dateTo} />
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
