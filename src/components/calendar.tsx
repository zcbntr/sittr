"use client";
import { Calendar, momentLocalizer, type View } from "react-big-calendar";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEffect, useState } from "react";
import moment from "moment";
import { endOfMonth, startOfMonth } from "date-fns";
import CreateSittingDialog from "~/app/_components/createsittingdialog";
import { Button } from "./ui/button";
import { type SittingTypeEnum } from "~/lib/schema";
import { type DateRange } from "react-day-picker";
import EditSittingDialog from "~/app/_components/editsittingdialog";

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
  id: number;
  title: string;
  allDay: boolean;
  start: Date;
  end: Date;
  sittingType: SittingTypeEnum;
  desc: string;
  resourceId?: string;
  tooltip?: string;

  constructor(
    _id: number,
    _title: string,
    _start: Date,
    _endDate: Date,
    _sittingType: SittingTypeEnum,
    _allDay?: boolean,
    _desc?: string,
    _resourceId?: string,
  ) {
    this.id = _id;
    this.title = _title;
    this.allDay = _allDay ?? false;
    this.start = _start;
    this.end = _endDate;
    this.sittingType = _sittingType;
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
  const [editSittingDialogProps, setEditSittingDialogProps] = useState<{
    id: number;
    name: string;
    sittingType: SittingTypeEnum;
    dateRange: DateRange;
  }>();

  useEffect(() => {
    async function fetchData() {
      try {
        const sittingRequestsRes = await fetch(
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
        const data: unknown = await sittingRequestsRes.json();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const events: CalendarEvent[] = data.map((event) => {
          return {
            id: event.id,
            title: event.name,
            start: new Date(event.startDate),
            end: new Date(event.endDate),
            sittingType: event.category,
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
      void fetchData();
    });

    document.addEventListener("sittingUpdated", () => {
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

  const handleEventSelect = (event: CalendarEvent) => {
    const button = document.getElementById("openEditSittingDialogHiddenButton");
    if (button) {
      setEditSittingDialogProps({
        id: event.id,
        name: event.title,
        sittingType: event.sittingType,
        dateRange: {
          from: event.start,
          to: event.end,
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
        onSelectEvent={handleEventSelect}
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
        eventPropGetter={(event, start, end, isSelected) => {
          const newStyle = {
            backgroundColor: "lightgrey",
            color: "black",
          };

          if (event.sittingType == "Pet") {
            newStyle.backgroundColor = "#f54290";
          } else if (event.sittingType == "House") {
            newStyle.backgroundColor = "#424bf5";
          } else if (event.sittingType == "Plant") {
            newStyle.backgroundColor = "#87f542";
          } else if (event.sittingType == "Baby") {
            newStyle.backgroundColor = "#f5bf42";
          }

          return {
            className: "",
            style: newStyle,
          };
        }}
      />

      <CreateSittingDialog props={createSittingDialogProps}>
        <Button
          id="openCreateSittingDialogHiddenButton"
          className="hidden"
        ></Button>
      </CreateSittingDialog>

      <EditSittingDialog props={editSittingDialogProps}>
        <Button
          id="openEditSittingDialogHiddenButton"
          className="hidden"
        ></Button>
      </EditSittingDialog>
    </div>
  );
}
