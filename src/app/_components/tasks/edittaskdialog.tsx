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
import { format } from "date-fns";
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
import type { Group } from "~/lib/schemas/groups";
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
import { useEffect, useState } from "react";

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

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      taskId: task?.taskId ? task.taskId : "",
      ownerId: task?.ownerId ? task.ownerId : "",
      name: task?.name ? task.name : "",
      description: task?.description ? task.description : "",
      dueMode: task?.dueMode ? task.dueMode : true,
      dueDate: task?.dueDate ? task.dueDate : null,
      dateRange: task?.dateRange ? task.dateRange : null,
      petId: task?.petId ? task.petId : "",
      groupId: task?.groupId ? task.groupId : "",
      markedAsDone: task?.markedAsDone ? task.markedAsDone : false,
      markedAsDoneBy: task?.markedAsDoneBy ? task.markedAsDoneBy : "",
      claimed: task?.claimed ? task.claimed : false,
      claimedBy: task?.claimedBy ? task.claimedBy : "",
    },
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
    data: deleteData,
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

  async function onSubmit(values: z.infer<typeof taskSchema>) {
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
    form.setValue("ownerId", task?.ownerId ? task.ownerId : "");
    form.setValue("name", task?.name ? task.name : "");
    form.setValue("description", task?.description ? task.description : "");
    form.setValue("dueMode", task?.dueMode ? task.dueMode : true);
    form.setValue("dueDate", task?.dueDate ? task.dueDate : null);
    form.setValue("dateRange", task?.dateRange ? task.dateRange : null);
    form.setValue("petId", task?.petId ? task.petId : "");
    form.setValue("groupId", task?.groupId ? task.groupId : "");
    setSelectedGroupId(task?.groupId ? task.groupId : "");
    form.setValue(
      "markedAsDone",
      task?.markedAsDone ? task.markedAsDone : false,
    );
    form.setValue(
      "markedAsDoneBy",
      task?.markedAsDoneBy ? task.markedAsDoneBy : "",
    );
    form.setValue("claimed", task?.claimed ? task.claimed : false);
    form.setValue("claimedBy", task?.claimedBy ? task.claimedBy : "");

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
      <DialogContent className="max-h-screen w-5/6 overflow-y-scroll rounded-md sm:w-[533px]">
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
                            selected={field.value ? field.value : new Date()}
                            onSelect={field.onChange}
                            initialFocus
                          />
                          <div className="border-t border-border p-3">
                            <TimePickerDemo
                              setDate={field.onChange}
                              date={field.value ? field.value : new Date()}
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
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group</FormLabel>
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
              name="petId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pet, House, or Plant</FormLabel>
                  <Select
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
                  <FormDescription>
                    Select a pet to associate with this task. The pet must be
                    assigned to the selected group.
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
