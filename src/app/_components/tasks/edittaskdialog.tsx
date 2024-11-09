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
import { type Group, groupListSchema } from "~/lib/schemas/groups";
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
import { Checkbox } from "~/components/ui/checkbox";
import { type Task, taskSchema } from "~/lib/schemas/tasks";
import { petListSchema, type Pet } from "~/lib/schemas/pets";
import {
  deleteTaskAction,
  updateTaskAction,
} from "~/server/actions/task-actions";
import { useServerAction } from "zsa-react";
import { toast } from "sonner";
import { MdDelete } from "react-icons/md";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

export default function EditTaskDialog({
  props,
  children,
}: {
  props?: Task;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState<boolean>(false);

  const [pets, setPets] = React.useState<Pet[]>([]);
  const [petsEmpty, setPetsEmpty] = React.useState<boolean>(false);
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [groupsEmpty, setGroupsEmpty] = React.useState<boolean>(false);

  const [dueMode, setDueMode] = React.useState<boolean>(true);
  const [dueDate, setDueDate] = React.useState<Date | undefined>();
  // This variable is actually used, just not detected by the linter as its properties are used not its value itself
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

  const [deleteClicked, setDeleteClicked] = React.useState<boolean>(false);

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
  });

  const {
    isPending: updatePending,
    execute: executeUpdate,
    data: updateData,
    error: updateError,
  } = useServerAction(updateTaskAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Task updated!");
      setOpen(false);
    },
  });

  const {
    isPending: deletePending,
    executeFormAction: executeDelete,
    data: deleteData,
    error: deleteError,
  } = useServerAction(deleteTaskAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Task deleted!");
      setOpen(false);
    },
  });

  async function onSubmit(values: z.infer<typeof taskSchema>) {
    const [data, err] = await executeUpdate(values);

    if (err) {
      toast.error(err.message);

      return;
    }

    form.reset();
  }

  // Update state upon props change, Update form value upon props change
  React.useEffect(
    () => {
      async function fetchPets() {
        await fetch("../api/group-pets?all=true", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((res) => res.json())
          .then((json) => petListSchema.safeParse(json))
          .then((validatedPetListObject) => {
            if (!validatedPetListObject.success) {
              throw new Error("Failed to get group's pets");
            }

            if (validatedPetListObject.data.length > 0) {
              setPets(validatedPetListObject.data);
            } else if (validatedPetListObject.data.length === 0) {
              setPetsEmpty(true);
            }
          });
      }

      async function fetchGroups() {
        await fetch("../api/groups?all=true", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((res) => res.json())
          .then((json) => groupListSchema.safeParse(json))
          .then((validatedGroupListObject) => {
            if (!validatedGroupListObject.success) {
              console.error(validatedGroupListObject.error.message);
              throw new Error("Failed to get user's groups");
            }

            if (validatedGroupListObject.data.length > 0) {
              setGroups(validatedGroupListObject.data);
            } else if (validatedGroupListObject.data.length === 0) {
              setGroupsEmpty(true);
            }
          });
      }

      if (props) {
        if (props?.taskId) {
          form.setValue("taskId", props.taskId);
        }

        if (props?.ownerId) {
          form.setValue("ownerId", props.ownerId);
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

        if (props?.groupId) {
          form.setValue("groupId", props.groupId);
        }
      }

      // Fetch all possible sitting pets
      void fetchPets();
      void fetchGroups();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[454px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6"
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
                            selected={field.value ? field.value : dueDate}
                            onSelect={field.onChange}
                            initialFocus
                          />
                          <div className="border-t border-border p-3">
                            <TimePickerDemo
                              setDate={field.onChange}
                              date={field.value ? field.value : dueDate}
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
              name="petId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pet, House, or Plant</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      form.setValue("petId", value);
                    }}
                    disabled={petsEmpty}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !petsEmpty
                              ? "Select a pet, house or plant"
                              : "Nothing to show"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pets.map((pet) => (
                        <SelectItem
                          key={pet.petId}
                          value={pet.petId.toString()}
                        >
                          {pet.name}
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
                      form.setValue("groupId", value);
                    }}
                    disabled={groupsEmpty}
                    value={field.value?.toString()}
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

            <FormField
              control={form.control}
              name="markedAsDone"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    {form.getValues("markedAsDoneBy") && field.value && (
                      <FormLabel>
                        Marked as complete by {form.getValues("markedAsDoneBy")}
                      </FormLabel>
                    )}
                    {(!form.getValues("markedAsDoneBy") || !field.value) && (
                      <FormLabel>Mark as complete</FormLabel>
                    )}
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <div className="flex grow flex-row place-content-between">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <MdDelete size={"1.2rem"} />
                      Delete Task
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Group</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription>
                      Are you sure you want to delete this group? This action
                      cannot be undone.
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                      <AlertDialogAction
                        disabled={deletePending}
                        onClick={async () => {
                          await executeDelete({ taskId: props?.taskId });
                        }}
                      >
                        Confirm
                      </AlertDialogAction>
                      <AlertDialogCancel disabled={deletePending}>
                        Cancel
                      </AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button type="submit" disabled={updatePending || deletePending}>
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
