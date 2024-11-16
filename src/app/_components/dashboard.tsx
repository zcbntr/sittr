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

export default async function Dashboard() {
  const { userId } = await auth();
  const groups = await getGroupsUserIsIn();

  return (
    <div className="flex flex-col gap-3 p-5">
      <h1 className="text-xl">Dashboard</h1>
      <section>
        <div className="flex flex-row gap-3">
          <CreateTaskDialog groups={groups}>
            <Button variant="outline">New Task</Button>
          </CreateTaskDialog>

          <CreatePetDialog>
            <Button variant="outline">New Pet</Button>
          </CreatePetDialog>

          <CreateGroupDialog>
            <Button variant="outline">New Group</Button>
          </CreateGroupDialog>
        </div>
      </section>
      <section>
        <div className="pb-5">
          <CalendarComponent userId={userId} groups={groups} />
        </div>
      </section>
    </div>
  );
}
