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

export default function EditTaskDialog({
  props,
  children,
}: {
  props?: Task;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [dataChanged, setDataChanged] = React.useState(false);

  const [subjects, setSubjects] = React.useState<SittingSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = React.useState<
    number | undefined
  >();
  const [subjectsEmpty, setSubjectsEmpty] = React.useState<boolean>(false);

  const [dueMode, setDueMode] = React.useState(true);
  const [dueDate, setDueDate] = React.useState<Date | undefined>();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

  const [deleteClicked, setDeleteClicked] = React.useState(false);

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
  });

  // Update state upon props change, Update form value upon props change
  React.useEffect(
    () => {
      if (props) {
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
      }
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
              void onSubmit(form.getValues());
            }}
            className="w-2/3 space-y-6"
            name="editTask"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      onChangeCapture={() => {
                        setDataChanged(true);
                      }}
                      placeholder="Pet sitting while I am away"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>e.g. Your pet&apos;s name</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          id="date"
                          variant={"outline"}
                          className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={(e) => {
                          setDateRange(e);
                          field.onChange(e);
                          setDataChanged(true);
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>The date(s) of your sitting</FormDescription>
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
