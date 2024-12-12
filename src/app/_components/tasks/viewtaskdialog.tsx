"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  MdLockOpen,
  MdLockOutline,
  MdOutlineCheck,
  MdOutlineCircle,
} from "react-icons/md";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type z } from "zod";
import { Form } from "~/components/ui/form";
import { type User } from "~/lib/schemas/users";

export default function ViewTaskDialog({
  currentUser,
  initialTaskData,
  children,
}: {
  currentUser: User | null;
  initialTaskData: Task | undefined;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const [task, setTask] = useState<Task | undefined>(initialTaskData);

  const claimTaskForm = useForm<z.infer<typeof setClaimTaskFormProps>>({
    resolver: zodResolver(setClaimTaskFormProps),
    defaultValues: {
      taskId: task?.taskId,
      claim: task?.claimedBy?.id === currentUser?.id,
    },
    mode: "onSubmit",
  });

  const markAsCompleteForm = useForm<
    z.infer<typeof setMarkedAsCompleteFormProps>
  >({
    resolver: zodResolver(setMarkedAsCompleteFormProps),
    defaultValues: {
      taskId: task?.taskId,
      markAsDone: task?.markedAsDoneBy?.id === currentUser?.id,
    },
    mode: "onSubmit",
  });

  const {
    isPending: claimPending,
    execute: executeClaim,
    error: claimError,
  } = useServerAction(setClaimTaskAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: (data) => {
      setTask(data.data);
      if (data.data.claimedBy?.id === currentUser?.id) {
        toast.success("Task claimed!");
        claimTaskForm.reset();
        claimTaskForm.setValue("taskId", data.data.taskId);
        claimTaskForm.setValue("claim", false);
      } else {
        toast.success("Task unclaimed!");
        claimTaskForm.reset();
        claimTaskForm.setValue("taskId", data.data.taskId);
        claimTaskForm.setValue("claim", true);
      }
    },
  });

  const {
    isPending: markAsDonePending,
    execute: executeMarkAsDone,
    error: markAsDoneError,
  } = useServerAction(setTaskMarkedAsDoneAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: (data) => {
      setTask(data.data);
      if (data.data.markedAsDoneBy?.id === currentUser?.id) {
        toast.success("Marked as done!");
        markAsCompleteForm.reset();
        markAsCompleteForm.setValue("taskId", data.data.taskId);
        markAsCompleteForm.setValue("markAsDone", false);
      } else {
        toast.success("Unmarked as done!");
        markAsCompleteForm.reset();
        markAsCompleteForm.setValue("taskId", data.data.taskId);
        markAsCompleteForm.setValue("markAsDone", true);
      }
    },
  });

  useEffect(() => {
    if (initialTaskData) {
      setTask(initialTaskData);
    }
  }, [initialTaskData]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="h-5/6 max-h-svh w-11/12 max-w-[500px] rounded-md sm:h-fit">
        <DialogHeader className="pb-2">
          <DialogTitle>{task?.name}</DialogTitle>
        </DialogHeader>

        <div className="h-full w-full space-y-4 px-1">
          {task?.dueMode && (
            <div>
              <div className="flex flex-row rounded-md">
                <div className="flex flex-col place-content-center">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                </div>

                <div>
                  {task?.dueDate ? format(task.dueDate, "MMMM do HH:mm") : ""}
                </div>
              </div>
            </div>
          )}

          {!task?.dueMode && (
            <div className="flex flex-row rounded-md">
              <div className="flex flex-col place-content-center">
                <CalendarIcon className="mr-2 h-4 w-4" />
              </div>
              <div>
                {task?.dateRange?.from
                  ? format(task.dateRange.from, "MMM do HH:mm")
                  : ""}{" "}
                -
                {task?.dateRange?.to
                  ? format(task?.dateRange?.to, "MMM do HH:mm")
                  : ""}
              </div>
            </div>
          )}

          <div className="flex flex-row gap-2">
            <Link href={`/pets/${task?.pet.id}`}>
              <Avatar>
                <AvatarImage
                  src={task?.pet.image}
                  alt={`${task?.pet.name}'s avatar`}
                />
                {/* Make this actually be the initials rather than first letter */}
                <AvatarFallback>
                  {task?.pet.name.substring(0, 1)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex flex-col place-content-center">
              {task?.pet.name} ({task?.group.name})
            </div>
          </div>

          <div>{task?.description}</div>

          {task?.claimedBy?.id == currentUser?.id &&
            task?.claimedAt && (
              <div className="text-sm font-medium">
                You claimed this task on{" "}
                {format(task.claimedAt, "MMM do HH:mm")}
              </div>
            )}

          {task?.markedAsDoneBy?.id == currentUser?.id &&
            task?.markedAsDoneAt && (
              <div className="text-sm font-medium">
                You completed this task on{" "}
                {format(task.markedAsDoneAt, "MMM do HH:mm")}
              </div>
            )}

          <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2">
            <Form {...claimTaskForm}>
              <form onSubmit={claimTaskForm.handleSubmit(executeClaim)}>
                <Button
                  className="h-fit w-full"
                  disabled={
                    (!claimTaskForm.getValues("taskId") ||
                      (task?.claimedBy &&
                        task.claimedBy?.id !== currentUser?.id)) ??
                    (markAsDonePending || claimPending)
                  }
                  type="submit"
                >
                  {task?.claimedBy &&
                    task.claimedBy?.id !== currentUser?.id && (
                      <div className="flex flex-row flex-nowrap">
                        <div className="flex flex-col place-content-center">
                          <MdLockOutline className="mr-1 h-4 w-4" />
                        </div>

                        <div>Claimed by {task.claimedBy?.name}</div>
                      </div>
                    )}
                  {task?.claimedBy &&
                    task.claimedBy?.id === currentUser?.id && (
                      <div className="flex flex-row flex-nowrap">
                        <div className="flex flex-col place-content-center">
                          <MdLockOpen className="mr-1 h-4 w-4" />
                        </div>

                        <div>Unclaim Task</div>
                      </div>
                    )}
                  {!task?.claimedBy && (
                    <div className="flex flex-row flex-nowrap">
                      <div className="flex flex-col place-content-center">
                        <MdLockOutline className="mr-1 h-4 w-4" />
                      </div>

                      <div>Claim Task</div>
                    </div>
                  )}
                </Button>
              </form>
            </Form>

            <Form {...markAsCompleteForm}>
              <form
                onSubmit={markAsCompleteForm.handleSubmit(executeMarkAsDone)}
              >
                <Button
                  className="h-fit w-full"
                  disabled={
                    (!markAsCompleteForm.getValues("taskId") ||
                      (task?.markedAsDoneBy &&
                        task.markedAsDoneBy?.id !== currentUser?.id)) ??
                    (markAsDonePending || claimPending)
                  }
                  type="submit"
                >
                  {task?.markedAsDoneBy &&
                    task.markedAsDoneBy?.id !== currentUser?.id && (
                      <div className="flex flex-row flex-nowrap">
                        <div className="flex flex-col place-content-center">
                          <MdOutlineCheck className="mr-1 h-4 w-4" />
                        </div>

                        <div>
                          Marked as complete by {task.markedAsDoneBy?.name}
                        </div>
                      </div>
                    )}
                  {task?.markedAsDoneBy &&
                    task.markedAsDoneBy?.id === currentUser?.id && (
                      <div className="flex flex-row flex-nowrap">
                        <div className="flex flex-col place-content-center">
                          <MdOutlineCircle className="mr-1 h-4 w-4" />
                        </div>
                        <div>Unmark as complete</div>
                      </div>
                    )}
                  {!task?.markedAsDoneBy && (
                    <div className="flex flex-row flex-nowrap">
                      <div className="flex flex-col place-content-center">
                        <MdOutlineCheck className="mr-1 h-4 w-4" />
                      </div>

                      <div>Mark as complete</div>
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>

        {claimError && <div>{claimError.message}</div>}
        {markAsDoneError && <div>{markAsDoneError.message}</div>}
      </DialogContent>
    </Dialog>
  );
}
