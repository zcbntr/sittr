/* displays big calender, overview of upcoming sittings, 
recent sittings, ability to create sittings (if owner),
ability to satisfy sitting requests (if sitter) */

import CalendarComponent from "~/components/calendar";
import SittingDialogue from "./createsittingdialogue";
import { Button } from "~/components/ui/button";
import { add } from "date-fns";

export default function Dashboard() {
  return (
    <div className="p-5">
      <h1 className="text-xl">Dashboard</h1>
      <div>
        <SittingDialogue props={{
          dateRange: {
            from: add(new Date(), { hours: 1 }),
            to: add(new Date(), { days: 1, hours: 1 }),
          },
        }}>
          <Button variant="outline">New Sitting</Button>
        </SittingDialogue>
      </div>
      <div className="pb-5">
        <CalendarComponent />
      </div>
    </div>
  );
}
