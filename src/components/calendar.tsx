"use client";
import { Calendar, momentLocalizer, type View } from "react-big-calendar";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Key, useEffect, useState } from "react";
import moment from "moment";
import { endOfMonth, startOfMonth } from "date-fns";
import SittingDialogue from "~/app/_components/createsittingdialogue";
import { Button } from "./ui/button";
import { SittingTypeEnum } from "~/lib/schema";
import { DateRange } from "react-day-picker";

// Start the week on a monday, and set the first week of the year to be the one that contains the first Thursday
moment.locale("en-GB", {
  week: {
    dow: 1,
    doy: 4,
  },
});

const allViews: View[] = ["agenda", "day", "week", "month"];

const localizer = momentLocalizer(moment);

class CalendarEvent {
  title: string;
  allDay: boolean;
  start: Date;
  end: Date;
  desc: string;
  resourceId?: string;
  tooltip?: string;

  constructor(
    _title: string,
    _start: Date,
    _endDate: Date,
    _allDay?: boolean,
    _desc?: string,
    _resourceId?: string,
  ) {
    this.title = _title;
    this.allDay = _allDay ?? false;
    this.start = _start;
    this.end = _endDate;
    this.desc = _desc ?? "";
    this.resourceId = _resourceId;
  }
}

export default function CalendarComponent() {
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState<Date>(new Date());
  const [events, setEvents] = useState([] as unknown as CalendarEvent[]);
  const [createSittingDialogProps, setCreateSittingDialogProps] = useState<{
    name?: string;
    sittingType?: SittingTypeEnum;
    dateRange?: DateRange;
  }>();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          "api/sittingrequest?" +
            new URLSearchParams({
              from: startOfMonth(new Date()).toString(),
              to: endOfMonth(new Date()).toString(),
            }).toString(),
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        const data: unknown = await res.json();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const events = data.map((event) => {
          return {
            title: event.name,
            start: new Date(event.startDate),
            end: new Date(event.endDate),
            allDay: false,
            desc: "",
          };
        });
        setEvents(events);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    void fetchData();

    document.addEventListener("sittingCreated", () => {
      console.log("Sitting created event received");
      void fetchData();
    });
  }, []);

  const handleDateSelect = ({ start, end }: { start: Date; end: Date }) => {
    // Find the openCreateSittingDialogHiddenButton and click it - workaround for avoiding putting the dialog in each calendar day
    const button = document.getElementById(
      "openCreateSittingDialogHiddenButton",
    );
    if (button) {
      setCreateSittingDialogProps({
        name: "",
        dateRange: {
          from: start,
          to: end,
        },
      });
      button.click();
    }
  };

  return (
    <div className="h-[38rem]">
      <div>
        <strong>
          Click an event to see more info, or drag the mouse over the calendar
          to select a date/time range.
        </strong>
      </div>
      <Calendar
        selectable
        localizer={localizer}
        events={events}
        onSelectEvent={(event: CalendarEvent) => alert(event.title)}
        onSelectSlot={handleDateSelect}
        views={allViews}
        defaultView={view}
        view={view}
        onView={(view) => setView(view)}
        defaultDate={new Date()}
        date={date}
        onNavigate={(date) => setDate(new Date(date))}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
      />

      <SittingDialogue props={createSittingDialogProps}>
        <Button
          id="openCreateSittingDialogHiddenButton"
          className="hidden"
        ></Button>
      </SittingDialogue>
    </div>
  );
}
