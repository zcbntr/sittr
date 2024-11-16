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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { type Task, taskSchema } from "~/lib/schemas/tasks";
import {
  toggleClaimTaskAction,
  toggleTaskMarkedAsDoneAction,
} from "~/server/actions/task-actions";
import { useServerAction } from "zsa-react";
import { toast } from "sonner";
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
    isPending: claimPending,
    execute: executeClaim,
    error: claimError,
  } = useServerAction(toggleClaimTaskAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Task claimed!");
      setOpen(false);
      form.reset();
    },
  });

  const {
    isPending: markAsDonePending,
    execute: executeMarkAsDone,
    error: markAsDoneError,
  } = useServerAction(toggleTaskMarkedAsDoneAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Marked as done!");
      setOpen(false);
      form.reset();
    },
  });

  //   async function onSubmit(values: z.infer<typeof taskSchema>) {
  //     const [data, err] = await executeClaim(values);

  //     if (err) {
  //       toast.error(err.message);

  //       return;
  //     }

  //     form.reset();
  //   }

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
  }, [task]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-screen w-full overflow-y-scroll rounded-md sm:w-[533px]">
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
                      readOnly
                      placeholder="The food box is on the dresser in the kitchen. He has three scoops for dinner."
                      {...field}
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

                    <FormControl>
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
                    </FormControl>

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

                    <FormControl>
                      <Button
                        variant="outline"
                        disabled
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
                    </FormControl>

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

                    <FormControl>
                      <Button
                        variant="outline"
                        disabled
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
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                    disabled
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
                    disabled
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
          </form>
        </Form>
        {claimError && <div>{claimError.message}</div>}
        {markAsDoneError && <div>{markAsDoneError.message}</div>}
      </DialogContent>
    </Dialog>
  );
}
