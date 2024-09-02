/* displays big calender, overview of upcoming sittings, 
recent sittings, ability to create sittings (if owner),
ability to satisfy sitting requests (if sitter) */

import CalendarComponent from "~/components/calendar";
import SittingDialogue from "./createsittingdialogue";

export default function Dashboard() {
  return (
    <>
      <div>Dashboard</div>
      <div>
        <SittingDialogue />
      </div>
      <CalendarComponent />
    </>
  );
}
