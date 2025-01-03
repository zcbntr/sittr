"use client";

import { Calendar, momentLocalizer, type View } from "react-big-calendar";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";
import moment from "moment";
import { addDays, addHours, addMilliseconds } from "date-fns";
import { Button } from "./ui/button";
import {
  EditTask,
  selectBasicTaskSchema,
  SelectTask,
  type CreateTaskFormProps,
  type SelectBasicTask,
} from "~/lib/schemas/tasks";
import EditTaskDialog from "~/app/_components/tasks/edittaskdialog";
import CreateTaskDialog from "~/app/_components/tasks/createtaskdialog";
import type { SelectGroupInput } from "~/lib/schemas/groups";
import ViewTaskDialog from "~/app/_components/tasks/viewtaskdialog";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type SelectUser } from "~/lib/schemas/users";

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
  task: SelectTask;
  title: string;
  allDay: boolean;
  start: Date;
  end: Date;
  desc: string;
  resourceId?: string;
  tooltip?: string;

  constructor(_task: SelectTask) {
    this.id = _task.id;
    this.task = _task;
    this.title = _task.name;
    this.allDay = _task.dueMode;

    if (_task.dueMode) {
      this.start = _task.dueDate ? _task.dueDate : new Date();
      this.end = addMilliseconds(_task.dueDate ? _task.dueDate : new Date(), 1);
    } else {
      this.start = _task.dateRangeFrom ? _task.dateRangeFrom : new Date();
      this.end = _task.dateRangeTo
        ? addMilliseconds(_task.dateRangeTo, 1)
        : addMilliseconds(new Date(), 1);
    }

    this.desc = _task.description ? _task.description : "";
    this.resourceId = _task.petId ? _task.petId : undefined;
  }
}

export default function CalendarComponent({
  tasks,
  currentUser,
  groups,
  canCreateTasks,
}: {
  tasks: SelectBasicTask[];
  currentUser: SelectUser;
  groups: SelectGroupInput[];
  canCreateTasks: boolean;
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
  const [selectedTask, setSelectedTask] = useState<SelectBasicTask>();

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
          dateRangeFrom: startAdjusted,
          dateRangeTo: addHours(startAdjusted, 8),
        });
      } else {
        setCreateTaskDialogProps({
          dueMode: false,
          dueDate: startAdjusted,
          dateRangeFrom: startAdjusted,
          dateRangeTo: endAdjusted,
        });
      }

      button.click();
    }
  };

  const handleEventSelect = (event: CalendarEvent) => {
    // Check if the user owns the task
    if (event.task.ownerId !== currentUser.id) {
      const button = document.getElementById("openViewTaskDialogHiddenButton");
      if (button) {
        setSelectedTask(selectBasicTaskSchema.parse({ ...event.task }));
        button.click();
      }
    } else {
      const button = document.getElementById("openEditTaskDialogHiddenButton");
      if (button) {
        setSelectedTask(selectBasicTaskSchema.parse({ ...event.task }));
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
            const petId = event.task.petId;
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
              (event.task.claimedBy &&
                event.task.claimedBy?.id != currentUser.id) ||
              (!event.task.claimedBy && event.task.ownerId != currentUser.id)
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

        <CreateTaskDialog
          showRepeatingOption={currentUser.plusMembership}
          groups={groups}
          props={createTaskDialogProps}
        >
          <Button
            id="openCreateTaskDialogHiddenButton"
            className="hidden"
            disabled={!canCreateTasks}
          ></Button>
        </CreateTaskDialog>

        <EditTaskDialog groups={groups} task={selectedTask}>
          <Button id="openEditTaskDialogHiddenButton" className="hidden" />
        </EditTaskDialog>

        <ViewTaskDialog
          currentUser={currentUser}
          initialTaskData={selectedTask}
        >
          <Button id="openViewTaskDialogHiddenButton" className="hidden" />
        </ViewTaskDialog>
      </div>
    </div>
  );
}
