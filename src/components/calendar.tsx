"use client";
import { Calendar, momentLocalizer, type View } from "react-big-calendar";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEffect, useState } from "react";
import moment from "moment";
import { endOfMonth, startOfMonth } from "date-fns";
import { Button } from "./ui/button";
import { CreateTaskFormProps, Task, type SittingTypeEnum } from "~/lib/schema";
import { type DateRange } from "react-day-picker";
import EditTaskDialog from "~/app/_components/edittaskdialog";
import CreateTaskDialog from "~/app/_components/createtaskdialog";

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
  dueMode: boolean;
  start: Date;
  end: Date;
  subjectId: number;
  groupId?: number;
  markedAsDone: boolean;
  markedAsDoneBy?: number;
  desc: string;
  resourceId?: string;
  tooltip?: string;

  constructor(
    _id: number,
    _title: string,
    _dueMode: boolean,
    _start: Date,
    _endDate: Date,
    _subjectId: number,
    _markedAsDone: boolean,
    _markedAsDoneBy?: number,
    _groupId?: number,
    _allDay?: boolean,
    _desc?: string,
    _resourceId?: string,
  ) {
    this.id = _id;
    this.title = _title;
    this.allDay = _allDay ?? false;
    this.dueMode = _dueMode;
    this.start = _start;
    this.end = _endDate;
    this.subjectId = _subjectId;
    this.groupId = _groupId;
    this.markedAsDone = _markedAsDone;
    this.markedAsDoneBy = _markedAsDoneBy;
    this.desc = _desc ?? "";
    this.resourceId = _resourceId;
  }
}

export default function CalendarComponent() {
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState<Date>(new Date());
  const [events, setEvents] = useState([] as unknown as CalendarEvent[]);
  const [createTaskDialogProps, setCreateTaskDialogProps] =
    useState<CreateTaskFormProps>();
  const [editTaskDialogProps, setEditTaskDialogProps] = useState<Task>();

  useEffect(() => {
    async function fetchData() {
      try {
        const tasksRes = await fetch(
          "api/task?" +
            new URLSearchParams({
              from: startOfMonth(new Date()).toString(),
              to: endOfMonth(new Date()).toString(),
              all: "true",
            }).toString(),
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        const data: Task[] = await tasksRes.json();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        if (data) {
          const events: CalendarEvent[] = data.map((task) => {
            return new CalendarEvent(
              task.id,
              task.name,
              task.dueMode,
              new Date(task.dateRange?.from),
              new Date(task.dateRange?.to),
              task.subjectId,
              task.markedAsDone,
              task.markedAsDoneBy,
              task.groupId,
              false,
              task.description ? task.description : "",
            );
          });

          setEvents(events);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    void fetchData();

    document.addEventListener("taskCreated", () => {
      void fetchData();
    });

    document.addEventListener("taskUpdated", () => {
      void fetchData();
    });

    document.addEventListener("taskDeleted", () => {
      void fetchData();
    });
  }, []);

  const handleDateSelect = ({ start, end }: { start: Date; end: Date }) => {
    // Find the openCreateTaskDialogHiddenButton and click it - workaround for avoiding putting the dialog in each calendar day
    const button = document.getElementById("openCreateTaskDialogHiddenButton");
    if (button) {
      setCreateTaskDialogProps({
        dueMode: false,
        dueDate: start,
        dateRange: {
          from: start,
          to: end,
        },
      });
      button.click();
    }
  };

  const handleEventSelect = (event: CalendarEvent) => {
    const button = document.getElementById("openEditTaskDialogHiddenButton");
    if (button) {
      setEditTaskDialogProps({
        id: event.id,
        name: event.title,
        description: event.desc,
        subjectId: event.subjectId,
        groupId: event.groupId,
        dueMode: event.dueMode,
        dueDate: event.end,
        dateRange: {
          from: event.start,
          to: event.end,
        },
        markedAsDone: event.markedAsDone,
        markedAsDoneBy: event.markedAsDoneBy
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

          // Replace with either group based colour or subject based colour
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

      <CreateTaskDialog props={createTaskDialogProps}>
        <Button
          id="openCreateTaskDialogHiddenButton"
          className="hidden"
        ></Button>
      </CreateTaskDialog>

      <EditTaskDialog props={editTaskDialogProps}>
        <Button id="openEditTaskDialogHiddenButton" className="hidden"></Button>
      </EditTaskDialog>
    </div>
  );
}
