"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  setClaimTaskFormProps,
  setMarkedAsCompleteFormProps,
  type Task,
  taskSchema,
} from "~/lib/schemas/tasks";
import {
  setClaimTaskAction,
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

  const claimTaskForm = useForm<z.infer<typeof setClaimTaskFormProps>>({
    resolver: zodResolver(setClaimTaskFormProps),
    defaultValues: {
      claimed: task?.claimed,
    },
    mode: "onChange",
  });

  const markAsCompleteForm = useForm<
    z.infer<typeof setMarkedAsCompleteFormProps>
  >({
    resolver: zodResolver(setMarkedAsCompleteFormProps),
    defaultValues: {
      markedAsDone: task?.markedAsDone,
    },
    mode: "onChange",
  });

  const {
    isPending: claimPending,
    execute: executeClaim,
    error: claimError,
  } = useServerAction(setClaimTaskAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Task claimed!");
      setOpen(false);
      claimTaskForm.reset();
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
      markAsCompleteForm.reset();
    },
  });

  useEffect(() => {
    claimTaskForm.reset({
      claimed: task?.claimed,
    });

    markAsCompleteForm.reset({
      markedAsDone: task?.markedAsDone,
    });
  }, [task]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-screen w-full overflow-y-scroll rounded-md sm:w-[533px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            View the details of the task. You can claim and mark it as done
            here.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full space-y-6">
          <div>Name</div>
          <Input readOnly value={task?.name} />

          <div>Description</div>

          <Textarea readOnly value={task?.description} />

          {task?.dueMode && (
            <div>
              <div>Due Date/Time</div>
              <div className="flex flex-row rounded-md">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <div>
                  {task?.dueDate ? format(task.dueDate, "PPP HH:mm:ss") : ""}
                </div>
              </div>
            </div>
          )}

          {!task?.dueMode && (
            <div>
              <div>Start Date/Time</div>

              <Input readOnly>
                <CalendarIcon className="mr-2 h-4 w-4" />
                <div>
                  {task?.dateRange?.from
                    ? format(task.dateRange.from, "PPP HH:mm:ss")
                    : ""}
                </div>
              </Input>
            </div>
          )}

          {!task?.dueMode && (
            <div>
              <div>End Date/Time</div>

              <Input readOnly>
                <CalendarIcon className="mr-2 h-4 w-4" />
                <div>
                  {task?.dateRange?.to
                    ? format(task?.dateRange?.to, "PPP HH:mm:ss")
                    : ""}
                </div>
              </Input>
            </div>
          )}

          {/* Need to fetch group name with this id */}
          <div>
            <div>Group</div>
            <Input readOnly value={task?.groupId}></Input>
          </div>

          {/* Need to fetch pet name with this id */}
          <div>
            <div>Pet</div>
            <Input readOnly value={task?.petId}></Input>
          </div>

          <Form {...claimTaskForm}>
            <form onSubmit={claimTaskForm.handleSubmit(executeClaim)}>
              <FormField
                control={claimTaskForm.control}
                name="claimed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      {task?.claimedBy && field.value && (
                        <FormLabel>Claimed by {task?.claimedBy}</FormLabel>
                      )}
                      {(!task?.claimedBy || !field.value) && (
                        <FormLabel>Claim</FormLabel>
                      )}
                    </div>
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <Form {...markAsCompleteForm}>
            <form onSubmit={markAsCompleteForm.handleSubmit(executeMarkAsDone)}>
              <FormField
                control={markAsCompleteForm.control}
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
                      {task?.markedAsDoneBy && field.value && (
                        <FormLabel>
                          Marked as complete by {task?.markedAsDoneBy}
                        </FormLabel>
                      )}
                      {(!task?.markedAsDoneBy || !field.value) && (
                        <FormLabel>Mark as complete</FormLabel>
                      )}
                    </div>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {claimError && <div>{claimError.message}</div>}
        {markAsDoneError && <div>{markAsDoneError.message}</div>}
      </DialogContent>
    </Dialog>
  );
}
