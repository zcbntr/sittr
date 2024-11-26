"use client";

import { Calendar, momentLocalizer, type View } from "react-big-calendar";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";
import moment from "moment";
import { addDays, addHours, addMilliseconds } from "date-fns";
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
import { type User } from "~/lib/schemas/users";
import { type Pet } from "~/lib/schemas/pets";

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
  owner: User;
  createdBy: User;
  title: string;
  allDay: boolean;
  dueMode: boolean;
  dueDate: Date | null;
  dateRange: DateRange | null;
  start: Date;
  end: Date;
  pet: Pet;
  group: Group;
  markedAsDone: boolean;
  markedAsDoneBy?: User;
  claimed: boolean;
  claimedBy?: User;
  desc: string;
  resourceId?: string;
  tooltip?: string;

  constructor(_task: Task) {
    this.id = _task.taskId;
    this.owner = _task.owner;
    this.createdBy = _task.createdBy;
    this.title = _task.name;
    this.allDay = _task.dueMode;
    this.dueMode = _task.dueMode;
    this.dueDate = _task.dueDate ? new Date(_task.dueDate) : null;
    this.dateRange = _task.dateRange ? _task.dateRange : null;
    this.start = _task.dateRange?.from
      ? _task.dateRange.from
      : _task.dueDate
        ? _task.dueDate
        : new Date();
    this.end = _task.dateRange?.to
      ? _task.dateRange.to
      : _task.dueDate
        ? addMilliseconds(_task.dueDate, 1)
        : addMilliseconds(new Date(), 1);
    this.markedAsDone = _task.markedAsDone;
    this.markedAsDoneBy = _task.markedAsDoneBy
      ? _task.markedAsDoneBy
      : undefined;
    this.claimed = _task.claimed;
    this.claimedBy = _task.claimedBy ? _task.claimedBy : undefined;
    this.pet = _task.pet;
    this.group = _task.group;
    this.desc = _task.description ? _task.description : "";
    this.resourceId = _task.pet.petId;
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
    return new CalendarEvent(task);
  });
  const [createTaskDialogProps, setCreateTaskDialogProps] =
    useState<CreateTaskFormProps>();
  const [selectedTask, setSelectedTask] = useState<Task>();

  const handleDateSelect = ({ start, end }: { start: Date; end: Date }) => {
    // Find the openCreateTaskDialogHiddenButton and click it - workaround for avoiding putting the dialog in each calendar day
    const button = document.getElementById("openCreateTaskDialogHiddenButton");
    if (button) {
      const startAdjusted = addHours(start, 9);
      const endAdjusted = addHours(end, 9);

      // This is true if a single day is clicked on the calendar month view
      if (addDays(start, 1) == end || start == end) {
        // Set date range to 9-5
        setCreateTaskDialogProps({
          dueMode: true,
          dueDate: startAdjusted,
          dateRange: {
            from: startAdjusted,
            to: addHours(startAdjusted, 8),
          },
        });
      } else {
        setCreateTaskDialogProps({
          dueMode: false,
          dueDate: startAdjusted,
          dateRange: {
            from: startAdjusted,
            to: endAdjusted,
          },
        });
      }

      button.click();
    }
  };

  const handleEventSelect = (event: CalendarEvent) => {
    // Check if the user owns the task
    if (event.owner.userId !== userId) {
      const button = document.getElementById("openViewTaskDialogHiddenButton");
      if (button) {
        setSelectedTask(
          taskSchema.parse({
            taskId: event.id,
            owner: event.owner,
            createdBy: event.createdBy,
            name: event.title,
            description: event.desc,
            pet: event.pet,
            group: event.group,
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
            owner: event.owner,
            createdBy: event.createdBy,
            name: event.title,
            description: event.desc,
            pet: event.pet,
            group: event.group,
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
            const petId = event.pet.petId;
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
              (event.claimed && event.claimedBy?.userId != userId) ||
              (!event.claimed && event.owner.userId != userId)
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
