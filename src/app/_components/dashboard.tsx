/* displays big calender, overview of upcoming sittings, 
recent sittings, ability to create sittings (if owner),
ability to satisfy sitting requests (if sitter) */

import CalendarComponent from "~/components/calendar";
import { Button } from "~/components/ui/button";
import CreateTaskDialog from "./tasks/createtaskdialog";
import { getGroupsUserIsIn } from "~/server/queries/groups";
import { getTasksInRange } from "~/server/queries/tasks";
import TaskTypeSelect from "./dashboard/tasks-type-select";
import { Suspense } from "react";
import MonthArrows from "./dashboard/month-arrows";
import { MdAddTask } from "react-icons/md";
import { getLoggedInUser } from "~/server/queries/users";
import { type TaskTypeEnum } from "~/lib/schemas";
import { redirect } from "next/navigation";

export default async function Dashboard({
  dateFrom,
  dateTo,
  tasksType,
}: {
  dateFrom: Date;
  dateTo: Date;
  tasksType: TaskTypeEnum;
}) {
  const [currentUser, groups, tasks] = await Promise.all([
    getLoggedInUser(),
    getGroupsUserIsIn(),
    getTasksInRange(dateFrom, dateTo, tasksType),
  ]);

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-3 p-5">
      <section>
        <div className="flex flex-row flex-wrap place-content-center gap-2 sm:place-content-end">
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
            <CalendarComponent
              currentUser={currentUser}
              groups={groups}
              tasks={tasks}
            />
          </div>
        </Suspense>
      </section>
    </div>
  );
}
