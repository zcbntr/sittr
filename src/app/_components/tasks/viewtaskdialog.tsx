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
import { type Task } from "~/lib/schemas/tasks";
import {
  setClaimTaskAction,
  setTaskMarkedAsDoneAction,
} from "~/server/actions/task-actions";
import { useServerAction } from "zsa-react";
import { toast } from "sonner";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  MdLockOpen,
  MdLockOutline,
  MdOutlineCheck,
  MdOutlineCircle,
} from "react-icons/md";

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
    onSuccess: () => {
      toast.success("Marked as done!");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="h-5/6 max-h-svh w-11/12 max-w-[450px] rounded-md sm:h-fit">
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
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2">
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
            </div>
          )}

          <div className="flex flex-row gap-2">
            <Link href={`/pets/${task?.pet.petId}`}>
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

          <div className="grid grid-cols-2 gap-4">
            <Button
              disabled={
                !task ||
                (task?.claimedBy !== null &&
                  task?.claimedBy !== undefined &&
                  task?.claimedBy.userId !== userId &&
                  userId !== null) ||
                markAsDonePending ||
                claimPending
              }
              onClick={async () => {
                if (!task) return;

                await executeClaim({
                  taskId: task?.taskId,
                  claimed: !task.claimed,
                });
              }}
            >
              {task?.claimedBy && task?.claimedBy.userId !== userId && (
                <div className="flex flex-row flex-nowrap">
                  <div className="flex flex-col place-content-center">
                    <MdLockOutline className="mr-1 h-4 w-4" />
                  </div>

                  <div>Claimed by {task?.claimedBy.name}</div>
                </div>
              )}
              {task?.claimedBy && task?.claimedBy.userId === userId && (
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

            <Button
              disabled={
                !task ||
                (task?.claimedBy !== null &&
                  task?.claimedBy !== undefined &&
                  task?.claimedBy.userId !== userId &&
                  userId !== null) ||
                markAsDonePending ||
                claimPending
              }
              onClick={async () => {
                if (!task) return;

                await executeMarkAsDone({
                  taskId: task?.taskId,
                  markedAsDone: !task.markedAsDone,
                });
              }}
            >
              {task?.claimedBy && task?.claimedBy.userId !== userId && (
                <div className="flex flex-row flex-nowrap">
                  <div className="flex flex-col place-content-center">
                    <MdOutlineCheck className="mr-1 h-4 w-4" />
                  </div>

                  <div>Marked as complete by {task?.claimedBy.name}</div>
                </div>
              )}
              {task?.claimedBy && task?.claimedBy.userId === userId && (
                <div className="flex flex-row flex-nowrap">
                  <div className="flex flex-col place-content-center">
                    <MdOutlineCircle className="mr-1 h-4 w-4" />
                  </div>
                  <div>Unmark as complete</div>
                </div>
              )}
              {!task?.claimedBy && (
                <div className="flex flex-row flex-nowrap">
                  <div className="flex flex-col place-content-center">
                    <MdOutlineCheck className="mr-1 h-4 w-4" />
                  </div>

                  <div>Mark as complete</div>
                </div>
              )}
            </Button>
          </div>
        </div>

        {claimError && <div>{claimError.message}</div>}
        {markAsDoneError && <div>{markAsDoneError.message}</div>}
      </DialogContent>
    </Dialog>
  );
}
