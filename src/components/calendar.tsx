"use client";

import { Calendar, momentLocalizer, type View } from "react-big-calendar";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEffect, useState } from "react";
import moment from "moment";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { Button } from "./ui/button";
import {
  taskListSchema,
  TaskType,
  TaskTypeEnum,
  type CreateTaskFormProps,
  type Task,
} from "~/lib/schemas/tasks";
import EditTaskDialog from "~/app/_components/tasks/edittaskdialog";
import CreateTaskDialog from "~/app/_components/tasks/createtaskdialog";
import type { Group } from "~/lib/schemas/groups";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { DateRange } from "~/lib/schemas";

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
  dueDate: Date;
  dateRange: DateRange;
  start: Date;
  end: Date;
  petId?: string;
  groupId?: string;
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
    _dueDate: Date,
    _dateRange: DateRange,
    _start: Date,
    _endDate: Date,
    _markedAsDone: boolean,
    _claimed: boolean,
    _markedAsDoneBy?: string,
    _claimedBy?: string,
    _petId?: string,
    _groupId?: string,
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
    this.end = _endDate;
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
  userId,
  groups,
}: {
  userId: string | null;
  groups: Group[];
}) {
  const [tasksType, setTasksType] = useState<TaskTypeEnum>(
    TaskTypeEnum.Enum.All,
  );
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState<Date>(new Date());
  const [events, setEvents] = useState([] as unknown as CalendarEvent[]);
  const [createTaskDialogProps, setCreateTaskDialogProps] =
    useState<CreateTaskFormProps>();
  const [selectedTask, setSelectedTask] = useState<Task>();

  useEffect(() => {
    async function fetchData() {
      await fetch(
        "api/tasks?" +
          new URLSearchParams({
            from: startOfWeek(startOfMonth(new Date()), {
              weekStartsOn: 1,
            }).toString(),
            to: endOfWeek(endOfMonth(new Date()), {
              weekStartsOn: 1,
            }).toString(),
            type: tasksType,
          }).toString(),
      )
        .then((res) => res.json())
        .then((json) => taskListSchema.safeParse(json))
        .then((validatedTaskList) => {
          if (!validatedTaskList.success) {
            throw new Error("Failed to fetch tasks");
          }

          const events: CalendarEvent[] = validatedTaskList.data.map((task) => {
            return new CalendarEvent(
              task.taskId,
              task.ownerId,
              task.name,
              task.dueMode,
              task.dueDate ? new Date(task.dueDate) : new Date(),
              task.dateRange ?? {
                from: new Date(),
                to: new Date(),
              },
              new Date(
                task.dateRange?.from
                  ? task.dateRange.from
                  : task.dueDate
                    ? task.dueDate
                    : "",
              ),
              new Date(
                task.dateRange?.to
                  ? task.dateRange.to
                  : task.dueDate
                    ? task.dueDate
                    : "",
              ),
              task.markedAsDone,
              task.claimed,
              task.markedAsDoneBy ? task.markedAsDoneBy : undefined,
              task.claimedBy ? task.claimedBy : undefined,
              task.petId ? task.petId : "",
              task.groupId,
              false,
              task.description ? task.description : "",
            );
          });

          setEvents(events);
        });
    }

    void fetchData();
  }, [tasksType]);

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
      setSelectedTask({
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
      });
      button.click();
    }
  };

  return (
    <div>
      <div className="pb-3">
        <TaskTypeSelect
          showTaskTypes={tasksType}
          setShowTaskTypes={setTasksType}
        />
      </div>
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
              event.markedAsDone
            ) {
              newStyle.opacity = 0.5;
            }

            return {
              className: "",
              style: newStyle,
            };
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
      </div>
    </div>
  );
}

function TaskTypeSelect({
  showTaskTypes,
  setShowTaskTypes,
}: {
  showTaskTypes: TaskType;
  setShowTaskTypes: (taskType: TaskType) => void;
}) {
  return (
    <Select>
      <SelectTrigger>
        <SelectValue
          defaultValue={TaskTypeEnum.Values.All.toString()}
          placeholder={TaskTypeEnum.Values.All}
        >
          {showTaskTypes.toString()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.values(TaskTypeEnum.Values).map((taskType) => (
          <SelectItem
            value={taskType}
            key={taskType}
            onClick={() => setShowTaskTypes(taskType)}
          >
            {taskType.toString()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
