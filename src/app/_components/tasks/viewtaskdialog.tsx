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

// This shouldnt be forms, two different hooks for claiming and marking as done instead

export default function ViewTaskDialog({
  task,
  children,
}: {
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

        <div className="w-full space-y-6">
          <div>Name</div>
          <Input value={task?.name} />

          <div>Description</div>

          <Textarea readOnly value={task?.description} />

          {task?.dueMode && (
            <div>
              <div>Due Date/Time</div>
              <Input readOnly>
                <CalendarIcon className="mr-2 h-4 w-4" />
                <div>{format(task?.dueDate, "PPP HH:mm:ss")}</div>
              </Input>
            </div>
          )}

          {!task?.dueMode && (
            <div>
              <div>Start Date/Time</div>

              <Input readOnly>
                <CalendarIcon className="mr-2 h-4 w-4" />
                <div>{format(task?.dateRange?.from, "PPP HH:mm:ss")}</div>
              </Input>
            </div>
          )}

          {!task?.dueMode && (
            <div>
              <div>End Date/Time</div>

              <Input readOnly>
                <CalendarIcon className="mr-2 h-4 w-4" />
                <div>{format(task?.dateRange?.to, "PPP HH:mm:ss")}</div>
              </Input>
            </div>
          )}

          {/* Need to fetch group name with this id */}
          <Input readOnly value={task?.groupId}></Input>

          {/* Need to fetch pet name with this id */}
          <Input readOnly value={task?.petId}></Input>

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
        </div>

        {claimError && <div>{claimError.message}</div>}
        {markAsDoneError && <div>{markAsDoneError.message}</div>}
      </DialogContent>
    </Dialog>
  );
}
