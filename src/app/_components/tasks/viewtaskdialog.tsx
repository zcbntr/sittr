"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { type z } from "zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { Checkbox } from "~/components/ui/checkbox";
import {
  setClaimTaskFormProps,
  setMarkedAsCompleteFormProps,
  type Task,
} from "~/lib/schemas/tasks";
import {
  setClaimTaskAction,
  setTaskMarkedAsDoneAction,
} from "~/server/actions/task-actions";
import { useServerAction } from "zsa-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export default function ViewTaskDialog({
  userId,
  task,
  children,
}: {
  userId: string | null;
  task: Task | undefined;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState<boolean>(false);

  const claimTaskForm = useForm<z.infer<typeof setClaimTaskFormProps>>({
    resolver: zodResolver(setClaimTaskFormProps),
    defaultValues: {
      taskId: task?.taskId,
      claimed: task?.claimed,
    },
    mode: "onChange",
  });

  const markAsCompleteForm = useForm<
    z.infer<typeof setMarkedAsCompleteFormProps>
  >({
    resolver: zodResolver(setMarkedAsCompleteFormProps),
    defaultValues: {
      taskId: task?.taskId,
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
      claimTaskForm.reset();
    },
    onSuccess: () => {
      toast.success("Task claimed!");
      claimTaskForm.reset();
      claimTaskForm.setValue("claimed", true);
    },
  });

  const {
    isPending: markAsDonePending,
    execute: executeMarkAsDone,
    error: markAsDoneError,
  } = useServerAction(setTaskMarkedAsDoneAction, {
    onError: ({ err }) => {
      toast.error(err.message);
      markAsCompleteForm.reset();
    },
    onSuccess: () => {
      toast.success("Marked as done!");
      markAsCompleteForm.reset();
      markAsCompleteForm.setValue("markedAsDone", true);
    },
  });

  useEffect(() => {
    if (task) {
      claimTaskForm.setValue("taskId", task?.taskId);
      claimTaskForm.setValue("claimed", task?.claimed);
      markAsCompleteForm.setValue("taskId", task?.taskId);
      markAsCompleteForm.setValue("markedAsDone", task?.markedAsDone);
    }
  }, [task]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="h-5/6 max-h-svh w-11/12 max-w-[450px] rounded-md sm:h-fit">
        <DialogHeader className="pb-2">
          <DialogTitle>{task?.name}</DialogTitle>
          <DialogDescription>{task?.description}</DialogDescription>
        </DialogHeader>

        <div className="h-full w-full space-y-4">
          {task?.dueMode && (
            <div>
              <div className="flex flex-row rounded-md">
                <div className="flex flex-col place-content-center">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                </div>

                <div>
                  {task?.dueDate ? format(task.dueDate, "PPP HH:mm:ss") : ""}
                </div>
              </div>
            </div>
          )}

          {!task?.dueMode && (
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2">
              <Input readOnly>
                <div className="flex flex-col place-content-center">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <div>
                  {task?.dateRange?.from
                    ? format(task.dateRange.from, "PPP HH:mm:ss")
                    : ""}
                </div>
              </Input>

              <Input readOnly>
                <div className="flex flex-col place-content-center">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <div>
                  {task?.dateRange?.to
                    ? format(task?.dateRange?.to, "PPP HH:mm:ss")
                    : ""}
                </div>
              </Input>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div>Group</div>
            <Input
              readOnly
              value={task?.groupName ? task.groupName : task?.groupId}
            ></Input>
          </div>

          {/* Need to fetch pet name with this id */}
          <div className="flex flex-col gap-2">
            <div>Pet</div>
            <Input
              readOnly
              value={task?.petName ? task.petName : task?.petId}
            ></Input>
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
                        disabled={
                          (task?.claimedBy !== null &&
                            task?.claimedBy !== undefined &&
                            task?.claimedBy.id !== userId &&
                            userId !== null) ||
                          markAsDonePending ||
                          claimPending
                        }
                        checked={field.value}
                        onCheckedChange={async (checked: boolean) => {
                          field.onChange();
                          claimTaskForm.setValue("claimed", checked);
                          await claimTaskForm.handleSubmit(executeClaim)();
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      {task?.claimedBy && field.value && (
                        <FormLabel>Claimed by {task?.claimedBy.name}</FormLabel>
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
                        disabled={
                          (task?.claimedBy !== null &&
                            task?.claimedBy !== undefined &&
                            task?.claimedBy.id !== userId &&
                            userId !== null) ||
                          markAsDonePending ||
                          claimPending
                        }
                        checked={field.value}
                        onCheckedChange={async (checked: boolean) => {
                          field.onChange();

                          // If the user marks the task as complete, we should also claim it if it is not already claimed
                          if (!task?.claimedBy) {
                            claimTaskForm.setValue("claimed", true);
                            claimTaskForm.handleSubmit(executeClaim);
                          }

                          markAsCompleteForm.setValue("markedAsDone", checked);
                          await markAsCompleteForm.handleSubmit(
                            executeMarkAsDone,
                          )();
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      {task?.markedAsDoneBy && field.value && (
                        <FormLabel>
                          Marked as complete by {task?.markedAsDoneBy.name}
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
