"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { type DateRange } from "react-day-picker";
import { type z } from "zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { SittingSubject, type Task, taskSchema } from "~/lib/schema/index";
import { TimePickerDemo } from "~/components/ui/time-picker-demo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";

export default function EditTaskDialog({
  props,
  children,
}: {
  props?: Task;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState<boolean>(false);
  const [dataChanged, setDataChanged] = React.useState<boolean>(false);

  const [subjects, setSubjects] = React.useState<SittingSubject[]>([]);
  const [subjectsEmpty, setSubjectsEmpty] = React.useState<boolean>(false);
  const [groups, setGroups] = React.useState<SittingSubject[]>([]);
  const [groupsEmpty, setGroupsEmpty] = React.useState<boolean>(false);

  const [dueMode, setDueMode] = React.useState<boolean>(true);
  const [dueDate, setDueDate] = React.useState<Date | undefined>();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

  const [deleteClicked, setDeleteClicked] = React.useState<boolean>(false);

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
  });

  // Update state upon props change, Update form value upon props change
  React.useEffect(
    () => {
      async function fetchSubjects() {
        await fetch("api/sittingsubject?all=true")
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              setSubjectsEmpty(true);
              console.error(data.error);
              return;
            }

            if (data.length > 0) {
              setSubjects(data);
            } else if (data.length === 0) {
              setSubjectsEmpty(true);
            }
          });
      }

      async function fetchGroups() {
        await fetch("api/group?all=true")
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              setGroupsEmpty(true);
              console.error(data.error);
              return;
            }

            if (data.length > 0) {
              setGroups(data);
            } else if (data.length === 0) {
              setGroupsEmpty(true);
            }
          });
      }

      if (props) {
        if (props?.id) {
          form.setValue("id", props.id);
        }

        if (props?.dueMode !== undefined) {
          setDueMode(props.dueMode);
          form.setValue("dueMode", props.dueMode);
        }

        if (props?.dueDate) setDueDate(props?.dueDate);

        if (props?.dateRange)
          setDateRange({
            from: props?.dateRange?.from,
            to: props?.dateRange?.to,
          });

        if (props?.name) {
          form.setValue("name", props.name);
        }

        if (props?.description) {
          form.setValue("description", props.description);
        }

        if (props?.dueDate) {
          form.setValue("dueDate", props.dueDate);
        }

        if (props?.dateRange) {
          form.setValue("dateRange", {
            from: props?.dateRange?.from,
            to: props?.dateRange?.to,
          });
        }

        if (props?.subjectId) {
          form.setValue("subjectId", props.subjectId);
        }

        if (props?.groupId) {
          form.setValue("groupId", props.groupId);
        }
      }

      // Fetch all possible sitting subjects
      void fetchSubjects();
      void fetchGroups();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props],
  );

  async function onSubmit(data: z.infer<typeof taskSchema>) {
    if (deleteClicked) {
      await deleteTask();
      return;
    }

    const res = await fetch("api/task", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      console.log(res);
      return;
    }

    const resData = await res.json();

    if (!resData.error) {
      setOpen(false);
      document.dispatchEvent(new Event("taskUpdated"));
    } else {
      console.log(resData);
    }
  }

  async function deleteTask() {
    // Fix this at some point with another dialog
    // eslint-disable-next-line no-alert
    if (window.confirm("Are you sure you want to delete this task?")) {
      const res = await fetch("api/task", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: form.getValues().id }),
      });

      if (res.ok) {
        setOpen(false);
        document.dispatchEvent(new Event("taskDeleted"));
      } else {
        console.log(res);
      }

      setDeleteClicked(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[454px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              console.log(form.getValues());
              void onSubmit(form.getValues());
            }}
            onChange={() => setDataChanged(true)}
            className="w-full space-y-6"
            name="editTask"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Give Jake his dinner" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="The food box is on the dresser in the kitchen. He has three scoops for dinner."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include important information sitters need to know. (Not
                    required)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="dueMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-3 pr-1">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Span Time Period
                      </FormLabel>
                      <FormDescription>
                        Toggle whether the task has a due date/time or is a span
                        of time.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={!field.value}
                        onCheckedChange={() => {
                          form.setValue("dueMode", !dueMode);
                          setDueMode(!dueMode);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {dueMode && (
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-left">Due Date/Time</FormLabel>
                      <Popover>
                        <FormControl>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-[280px] justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP HH:mm:ss")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                        </FormControl>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                          <div className="border-t border-border p-3">
                            <TimePickerDemo
                              setDate={field.onChange}
                              date={field.value}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!dueMode && (
                <FormField
                  control={form.control}
                  name="dateRange.from"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-left">
                        Start Date/Time
                      </FormLabel>
                      <Popover>
                        <FormControl>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-[280px] justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP HH:mm:ss")
                              ) : (
                                <span>Pick a start date/time</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                        </FormControl>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                          <div className="border-t border-border p-3">
                            <TimePickerDemo
                              setDate={field.onChange}
                              date={field.value}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!dueMode && (
                <FormField
                  control={form.control}
                  name="dateRange.to"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-left">End Date/Time</FormLabel>
                      <Popover>
                        <FormControl>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-[280px] justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP HH:mm:ss")
                              ) : (
                                <span>Pick a end date/time</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                        </FormControl>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                          <div className="border-t border-border p-3">
                            <TimePickerDemo
                              setDate={field.onChange}
                              date={field.value}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pet, House, or Plant</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      form.setValue("subjectId", parseInt(value));
                    }}
                    disabled={subjectsEmpty}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !subjectsEmpty
                              ? "Select a pet, house or plant"
                              : "Nothing to show"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem
                          key={subject.subjectId}
                          value={subject.subjectId.toString()}
                        >
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a pet, house or plant to associate with this task.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      form.setValue("groupId", parseInt(value));
                    }}
                    disabled={groupsEmpty}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !groupsEmpty
                              ? "Select group to associate with task"
                              : "Make a group first"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a group to associate with this task.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <div className="flex grow flex-row place-content-between">
                <Button
                  id="deleteTaskButton"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    setDeleteClicked(true);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#e8eaed"
                  >
                    <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                  </svg>
                </Button>
                <Button type="submit" disabled={!dataChanged}>
                  Update Task
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
