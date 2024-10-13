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
import {
  type CreateTaskFormProps,
  createTaskFormSchema,
  type DateRange,
  type SittingSubject,
} from "~/lib/schema/index";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { TimePickerDemo } from "~/components/ui/time-picker-demo";
import { cn } from "~/lib/utils";
import { add, format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export default function CreateTaskDialog({
  props,
  children,
}: {
  props?: CreateTaskFormProps;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState<boolean>(false);

  const defaultFromDate = add(new Date(), { hours: 1 });
  const defaultToDate = add(new Date(), { days: 1, hours: 1 });

  const [subjects, setSubjects] = React.useState<SittingSubject[]>([]);
  const [subjectsEmpty, setSubjectsEmpty] = React.useState<boolean>(false);

  const [dueMode, setDueMode] = React.useState<boolean>(true);
  const [dueDate, setDueDate] = React.useState<Date | undefined>();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

  const form = useForm<z.infer<typeof createTaskFormSchema>>({
    resolver: zodResolver(createTaskFormSchema),
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

      if (props) {
        if (props?.dueMode !== undefined) {
          setDueMode(props.dueMode);
          form.setValue("dueMode", props.dueMode);
        }

        if (props?.dueDate) setDueDate(props?.dueDate);

        if (props?.dateRange)
          setDateRange({
            from: props?.dateRange?.from
              ? props.dateRange.from
              : defaultFromDate,
            to: props?.dateRange?.to ? props.dateRange.to : defaultToDate,
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
            from: props?.dateRange?.from
              ? props.dateRange.from
              : defaultFromDate,
            to: props?.dateRange?.to ? props.dateRange.to : defaultToDate,
          });
        }

        if (props?.subjectId) {
          form.setValue("subjectId", props.subjectId);
        }
      }

      // Fetch all possible sitting subjects
      void fetchSubjects();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props],
  );

  async function onSubmit(data: z.infer<typeof createTaskFormSchema>) {
    const res = await fetch("api/task", {
      method: "PUT",
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
      document.dispatchEvent(new Event("taskCreated"));
    } else {
      console.log(resData);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[454px]">
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void onSubmit(form.getValues());
            }}
            className="w-2/3 space-y-6"
            name="createPet"
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
            <FormField
              control={form.control}
              name="dueMode"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
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
                    <FormLabel className="text-left">Start Date/Time</FormLabel>
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

            <DialogFooter>
              <Button type="submit">Create Task</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
