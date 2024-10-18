"use server";

/* displays big calender, overview of upcoming sittings, 
recent sittings, ability to create sittings (if owner),
ability to satisfy sitting requests (if sitter) */

import CalendarComponent from "~/components/calendar";
import { Button } from "~/components/ui/button";
import CreatePetDialog from "./createpetdialog";
import CreateGroupDialog from "./creategroupdialog";
import CreateTaskDialog from "./createtaskdialog";
import CreateHouseDialog from "./createhousedialog";
import CreatePlantDialog from "./createplantdialog";
import { getCurrentUserPreferences } from "~/server/queries";

export default async function Dashboard() {
  const preferences = await getCurrentUserPreferences();

  return (
    <div className="flex flex-col gap-3 p-5">
      <h1 className="text-xl">Dashboard</h1>
      <div className="flex flex-row gap-3">
        <CreateTaskDialog>
          <Button variant="outline">New Task</Button>
        </CreateTaskDialog>

        {/* Eventually show or hide based on user preferences */}
        {preferences?.wantPetSitting && (
          <CreatePetDialog>
            <Button variant="outline">New Pet</Button>
          </CreatePetDialog>
        )}

        {preferences?.wantHouseSitting && (
          <CreateHouseDialog>
            <Button variant="outline">New House</Button>
          </CreateHouseDialog>
        )}

        {preferences?.wantPlantSitting && (
          <CreatePlantDialog>
            <Button variant="outline">New Plant</Button>
          </CreatePlantDialog>
        )}

        <CreateGroupDialog>
          <Button variant="outline">New Group</Button>
        </CreateGroupDialog>
      </div>
      <div className="pb-5">
        <CalendarComponent />
      </div>
    </div>
  );
}
