/* displays big calender, overview of upcoming sittings, 
recent sittings, ability to create sittings (if owner),
ability to satisfy sitting requests (if sitter) */

import CalendarComponent from "~/components/calendar";
import SittingDialogue from "./createsittingdialogue";

export default function Dashboard() {
  return (
    <div className="p-5">
      <h1 className="text-xl">Dashboard</h1>
      <div>
        <SittingDialogue />
      </div>
      <div className="pb-5">
        <CalendarComponent />
      </div>
    </div>
  );
}
