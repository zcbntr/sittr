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
import { addYears, format, subDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
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
  type Group,
} from "~/lib/schemas/groups";
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
import { type Task, updateTaskInputSchema } from "~/lib/schemas/tasks";
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
import { useEffect, useState } from "react";
import { petListSchema, type Pet } from "~/lib/schemas/pets";

export default function EditTaskDialog({
  groups,
  task,
  children,
}: {
  groups: Group[];
  task: Task | undefined;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState<boolean>(false);

  const [groupPets, setGroupPets] = useState<Pet[]>([]);
  const [petsEmpty, setPetsEmpty] = useState<boolean>(false);

  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(
    undefined,
  );
  const [dueMode, setDueMode] = useState<boolean>(true);

  const form = useForm<z.infer<typeof updateTaskInputSchema>>({
    resolver: zodResolver(updateTaskInputSchema),
    defaultValues: {
      taskId: task?.taskId ? task.taskId : "",
      name: task?.name ? task.name : "",
      description: task?.description ? task.description : "",
      dueMode: task?.dueMode ? task.dueMode : true,
      dueDate: task?.dueDate ? task.dueDate : undefined,
      dateRange: task?.dateRange ? task.dateRange : undefined,
      petId: task?.pet.petId ? task.pet.petId : "",
      groupId: task?.group.groupId ? task.group.groupId : "",
    },
  });

  const {
    isPending: updatePending,
    execute: executeUpdate,
    error: updateError,
  } = useServerAction(updateTaskAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Task updated!");
      setOpen(false);
      form.reset();
      setSelectedGroupId(undefined);
      setDueMode(true);
      setGroupPets([]);
      setPetsEmpty(false);
    },
  });

  const {
    isPending: deletePending,
    executeFormAction: executeDelete,
    error: deleteError,
  } = useServerAction(deleteTaskAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Task deleted!");
      setOpen(false);
      form.reset();
      setSelectedGroupId(undefined);
      setDueMode(true);
      setGroupPets([]);
      setPetsEmpty(false);
    },
  });

  async function onSubmit(values: z.infer<typeof updateTaskInputSchema>) {
    const [data, err] = await executeUpdate(values);

    if (err) {
      toast.error(err.message);

      return;
    }

    form.reset();
  }

  // Update state upon task change, Update form value upon task change
  useEffect(() => {
    form.setValue("taskId", task?.taskId ? task.taskId : "");
    form.setValue("name", task?.name ? task.name : "");
    form.setValue("description", task?.description ? task.description : "");
    form.setValue("dueMode", task?.dueMode ? task.dueMode : true);
    form.setValue("dueDate", task?.dueDate ? task.dueDate : undefined);
    form.setValue("dateRange", task?.dateRange ? task.dateRange : undefined);
    form.setValue("petId", task?.pet.petId ? task.pet.petId : "");
    form.setValue("groupId", task?.group.groupId ? task.group.groupId : "");
    setSelectedGroupId(task?.group.groupId ? task.group.groupId : "");

    async function fetchGroupPets() {
      await fetch("../api/group-pets?id=" + form.getValues("groupId"), {
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
            setGroupPets(validatedPetListObject.data);
          } else if (validatedPetListObject.data.length === 0) {
            setPetsEmpty(true);
          }
        });
    }

    // Fetch all possible sitting pets
    if (task) {
      void fetchGroupPets();
    }
  }, [task, selectedGroupId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="h-5/6 max-h-svh w-11/12 max-w-[450px] rounded-md sm:h-fit">
        <DialogHeader className="pb-2">
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="h-full w-full space-y-4 px-1"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueMode"
              render={({ field }) => (
                <FormItem className="flex flex-col justify-between pr-1">
                  <div className="flex flex-row gap-3">
                    <div className="flex flex-col place-content-center">
                      <FormLabel className="">Span Time Period</FormLabel>
                    </div>

                    <div className="flex flex-col place-content-center">
                      <FormControl>
                        <Switch
                          checked={!field.value}
                          onCheckedChange={() => {
                            form.setValue("dueMode", !dueMode);
                            setDueMode(!dueMode);
                          }}
                        />
                      </FormControl>
                    </div>
                  </div>

                  <FormDescription>
                    Toggle whether the task has a due date/time or is a span of
                    time.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {dueMode && (
              <div className="grid grid-cols-1 gap-2">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-left">
                        Due Date/Time *
                      </FormLabel>
                      <Popover>
                        <FormControl>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="h-4 w-4" />
                              {field.value ? (
                                format(field.value, "MMMM do HH:mm")
                              ) : (
                                <span>Pick a due date & time</span>
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
                            fromDate={subDays(new Date(), 1)}
                            toDate={addYears(new Date(), 1)}
                            disabled={(date) =>
                              date < new Date() && date > new Date("1900-01-01")
                            }
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
              </div>
            )}

            {!dueMode && (
              <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="dateRange.from"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-left">
                        Start Date/Time *
                      </FormLabel>
                      <Popover>
                        <FormControl>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="h-4 w-4" />
                              {field.value ? (
                                format(field.value, "MMM do HH:mm")
                              ) : (
                                <span>Pick a start date & time</span>
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
                            fromDate={subDays(new Date(), 1)}
                            toDate={addYears(new Date(), 1)}
                            disabled={(date) =>
                              date < new Date() && date > new Date("1900-01-01")
                            }
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

                <FormField
                  control={form.control}
                  name="dateRange.to"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-left">
                        End Date/Time *
                      </FormLabel>
                      <Popover>
                        <FormControl>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="h-4 w-4" />
                              {field.value ? (
                                format(field.value, "MMM do HH:mm")
                              ) : (
                                <span>Pick a end date & time</span>
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
                            fromDate={subDays(new Date(), 1)}
                            toDate={addYears(new Date(), 1)}
                            disabled={(date) =>
                              date < new Date() && date > new Date("1900-01-01")
                            }
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
              </div>
            )}

            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      form.setValue("groupId", value);
                      setSelectedGroupId(value);
                    }}
                    disabled={groups.length === 0}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            groups.length !== 0
                              ? "Select group to associate with task"
                              : "Make a group first"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem
                          key={group.groupId}
                          value={group.groupId.toString()}
                        >
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="petId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pet *</FormLabel>
                  <Select
                    defaultValue={
                      task?.pet.petId ? task.pet.petId.toString() : ""
                    }
                    value={field.value?.toString()}
                    onValueChange={(value) => {
                      form.setValue("petId", value);
                    }}
                    disabled={petsEmpty || groupPets.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !petsEmpty || groupPets.length !== 0
                              ? "Select a pet assigned to the group"
                              : "Choose a group with pets assigned"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groupPets.map((pet) => (
                        <SelectItem
                          key={pet.petId}
                          value={pet.petId.toString()}
                        >
                          {pet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-1 leading-none">
              {task?.markedAsDoneBy && (
                <div>Marked as complete by {task?.markedAsDoneBy?.name}</div>
              )}
            </div>

            <DialogFooter>
              <div className="flex grow flex-row place-content-between">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <MdDelete size={"1.2rem"} />
                      Delete Task
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-h-screen overflow-y-scroll rounded-md sm:w-[533px]">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription>
                      Are you sure you want to delete this task? This action
                      cannot be undone.
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                      <div className="grid-cols-auto grid gap-2">
                        <AlertDialogAction
                          disabled={deletePending}
                          onClick={async () => {
                            await executeDelete({
                              taskId: task?.taskId ? task.taskId : "",
                            });
                          }}
                        >
                          Confirm
                        </AlertDialogAction>
                        <AlertDialogCancel disabled={deletePending}>
                          Cancel
                        </AlertDialogCancel>
                      </div>
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
        {updateError && <div>{updateError.message}</div>}
        {deleteError && <div>{deleteError.message}</div>}
      </DialogContent>
    </Dialog>
  );
}
