"use client";

import { Calendar, momentLocalizer, type View } from "react-big-calendar";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";
import moment from "moment";
import { addHours, addMilliseconds } from "date-fns";
import { Button } from "./ui/button";
import {
  taskSchema,
  type CreateTaskFormProps,
  type Task,
} from "~/lib/schemas/tasks";
import EditTaskDialog from "~/app/_components/tasks/edittaskdialog";
import CreateTaskDialog from "~/app/_components/tasks/createtaskdialog";
import type { Group } from "~/lib/schemas/groups";
import { type DateRange } from "~/lib/schemas";
import ViewTaskDialog from "~/app/_components/tasks/viewtaskdialog";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const coloursList: string[] = [
  "#f54290",
  "#424bf5",
  "#87f542",
  "#f5bf42",
  "#f54290",
  "#424bf5",
  "#87f542",
  "#f5bf42",
];

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
  id: string;
  ownerId: string;
  title: string;
  allDay: boolean;
  dueMode: boolean;
  dueDate: Date | null;
  dateRange: DateRange | null;
  start: Date;
  end: Date;
  petId?: string;
  groupId: string;
  markedAsDone: boolean;
  markedAsDoneBy?: string;
  claimed: boolean;
  claimedBy?: string;
  desc: string;
  resourceId?: string;
  tooltip?: string;

  constructor(
    _id: string,
    _ownerId: string,
    _title: string,
    _dueMode: boolean,
    _dueDate: Date | null,
    _dateRange: DateRange | null,
    _start: Date,
    _end: Date,
    _markedAsDone: boolean,
    _claimed: boolean,
    _groupId: string,
    _markedAsDoneBy?: string,
    _claimedBy?: string,
    _petId?: string,
    _allDay?: boolean,
    _desc?: string,
    _resourceId?: string,
  ) {
    this.id = _id;
    this.ownerId = _ownerId;
    this.title = _title;
    this.allDay = _allDay ?? false;
    this.dueMode = _dueMode;
    this.dueDate = _dueDate;
    this.dateRange = _dateRange;
    this.start = _start;
    this.end = _end;
    this.markedAsDone = _markedAsDone;
    this.markedAsDoneBy = _markedAsDoneBy;
    this.claimed = _claimed;
    this.claimedBy = _claimedBy;
    this.petId = _petId;
    this.groupId = _groupId;
    this.desc = _desc ?? "";
    this.resourceId = _resourceId;
  }
}

export default function CalendarComponent({
  tasks,
  userId,
  groups,
}: {
  tasks: Task[];
  userId: string;
  groups: Group[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState<Date>(new Date());
  const events = tasks.map((task) => {
    return new CalendarEvent(
      task.taskId,
      task.ownerId,
      task.name,
      task.dueMode,
      task.dueDate ? new Date(task.dueDate) : null,
      task.dateRange ? task.dateRange : null,

      task.dateRange?.from
        ? task.dateRange.from
        : task.dueDate
          ? task.dueDate
          : new Date(),

      task.dateRange?.to
        ? task.dateRange.to
        : task.dueDate
          ? addMilliseconds(task.dueDate, 1)
          : addMilliseconds(new Date(), 1),

      task.markedAsDone,
      task.claimed,
      task.groupId,
      task.markedAsDoneBy ? task.markedAsDoneBy : undefined,
      task.claimedBy ? task.claimedBy : undefined,
      task.petId ? task.petId : "",
      task.dueMode,
      task.description ? task.description : "",
    );
  });
  const [createTaskDialogProps, setCreateTaskDialogProps] =
    useState<CreateTaskFormProps>();
  const [selectedTask, setSelectedTask] = useState<Task>();

  const handleDateSelect = ({ start, end }: { start: Date; end: Date }) => {
    // Find the openCreateTaskDialogHiddenButton and click it - workaround for avoiding putting the dialog in each calendar day
    const button = document.getElementById("openCreateTaskDialogHiddenButton");
    if (button) {
      setCreateTaskDialogProps({
        dueMode: false,
        dueDate: start,
        dateRange: {
          from: start,
          to: addHours(end, 1),
        },
      });
      button.click();
    }
  };

  const handleEventSelect = (event: CalendarEvent) => {
    // Check if the user owns the task
    if (event.ownerId !== userId) {
      const button = document.getElementById("openViewTaskDialogHiddenButton");
      if (button) {
        setSelectedTask(
          taskSchema.parse({
            taskId: event.id,
            ownerId: event.ownerId,
            name: event.title,
            description: event.desc,
            petId: event.petId,
            groupId: event.groupId,
            dueMode: event.dueMode,
            dueDate: event.dueDate,
            dateRange: event.dateRange,
            markedAsDone: event.markedAsDone,
            markedAsDoneBy: event.markedAsDoneBy,
            claimed: event.claimed,
            claimedBy: event.claimedBy,
            requiresVerification: false,
          }),
        );
        button.click();
      }
    } else {
      const button = document.getElementById("openEditTaskDialogHiddenButton");
      if (button) {
        setSelectedTask(
          taskSchema.parse({
            taskId: event.id,
            ownerId: event.ownerId,
            name: event.title,
            description: event.desc,
            petId: event.petId,
            groupId: event.groupId,
            dueMode: event.dueMode,
            dueDate: event.end,
            dateRange: event.start &&
              event.end && {
                from: event.start,
                to: event.end,
              },
            markedAsDone: event.markedAsDone,
            markedAsDoneBy: event.markedAsDoneBy,
            claimed: event.claimed,
            claimedBy: event.claimedBy,
            requiresVerification: false,
          }),
        );
        button.click();
      }
    }
  };

  return (
    <div>
      <div className="h-[37rem]">
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
          date={date}
          toolbar={false}
          onNavigate={(date) => setDate(new Date(date))}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          eventPropGetter={(event, _start, _end, _isSelected) => {
            const newStyle = {
              backgroundColor: "lightgrey",
              color: "black",
              opacity: 1,
              background: "",
            };

            // Map the event to a colour based on the petId
            const petId = event.petId;
            if (petId) {
              const colour =
                coloursList[
                  (petId
                    .split("")
                    .map((i) => i.charCodeAt(0))
                    .reduce((a, b) => a + b, 0) %
                    10) %
                    coloursList.length
                ];

              if (colour) newStyle.backgroundColor = colour;
            }

            // If the task is marked as done, or claimed by another user, change the background opacity
            if (
              (event.claimed && event.claimedBy != userId) ||
              (!event.claimed && event.ownerId != userId)
            ) {
              newStyle.opacity = 0.5;
            }

            return {
              className: "",
              style: newStyle,
            };
          }}
          onRangeChange={(range: Date[] | { start: Date; end: Date }) => {
            // Update search params with the new range
            const params = new URLSearchParams(searchParams);

            if (Array.isArray(range)) {
              const lastIndex = range.length - 1;
              if (!range[0] || !range[lastIndex]) return;
              params.set("from", range[0].toISOString());
              params.set("to", range[lastIndex].toISOString());
            } else {
              params.set("from", range.start.toISOString());
              params.set("to", range.end.toISOString());
            }

            router.replace(`${pathname}?${params.toString()}`);
          }}
        />

        <CreateTaskDialog groups={groups} props={createTaskDialogProps}>
          <Button
            id="openCreateTaskDialogHiddenButton"
            className="hidden"
          ></Button>
        </CreateTaskDialog>

        <EditTaskDialog groups={groups} task={selectedTask}>
          <Button id="openEditTaskDialogHiddenButton" className="hidden" />
        </EditTaskDialog>

        <ViewTaskDialog userId={userId} task={selectedTask}>
          <Button id="openViewTaskDialogHiddenButton" className="hidden" />
        </ViewTaskDialog>
      </div>
    </div>
  );
}
