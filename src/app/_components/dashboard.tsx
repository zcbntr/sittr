/* displays big calender, overview of upcoming sittings, 
recent sittings, ability to create sittings (if owner),
ability to satisfy sitting requests (if sitter) */

import CalendarComponent from "~/components/calendar";
import { Button } from "~/components/ui/button";
import CreatePetDialog from "./createpetdialog";
import CreateGroupDialog from "./creategroupdialog";
import CreateTaskDialog from "./createtaskdialog";

export default async function Dashboard() {
  return (
    <div className="flex flex-col gap-3 p-5">
      <h1 className="text-xl">Dashboard</h1>
      <section>
        <div className="flex flex-row gap-3">
          <CreateTaskDialog>
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
          <CalendarComponent />
        </div>
      </section>
    </div>
  );
}
