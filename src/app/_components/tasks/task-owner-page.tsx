"use client";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MdDelete, MdEdit } from "react-icons/md";
import { useServerAction } from "zsa-react";
import { deleteTaskAction } from "~/server/actions/task-actions";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { SelectTask } from "~/lib/schemas/tasks";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { SelectUser } from "~/lib/schemas/users";
import { TaskEditForm } from "./task-edit-form";
import { SelectBasicGroup } from "~/lib/schemas/groups";

export default function TaskOwnerPage({
  task,
  user,
  userGroups,
}: {
  task: SelectTask;
  user: SelectUser;
  userGroups: SelectBasicGroup[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("editing");

  const { isPending, execute } = useServerAction(deleteTaskAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      router.push("/");
      toast.success("Task deleted!");
    },
  });

  return (
    <div className="mx-auto space-y-6 sm:container">
      {isEditing ? (
        <TaskEditForm task={task} userGroups={userGroups} />
      ) : (
        <div className="flex w-full max-w-5xl flex-row place-content-center px-6 py-2">
          <div className="flex w-full max-w-xl flex-col gap-4">
            <div>
              <div className="flex flex-row gap-2">
                <Link
                  className="flex flex-col place-content-center"
                  href={`/pets/${task?.petId}`}
                >
                  <Avatar>
                    <AvatarImage
                      src={task?.pet?.image ? task.pet.image : ""}
                      alt={`${task?.pet?.name}'s avatar`}
                    />
                    {/* Make this actually be the initials rather than first letter */}
                    <AvatarFallback>
                      {task?.pet?.name.substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex flex-col">
                  <div className="flex flex-col place-content-center">
                    <div className="flex flex-row gap-2">
                      <span className="font-semibold">{task?.pet?.name}</span>
                      <span className="text-muted-foreground">
                        ({task?.group?.name})
                      </span>
                    </div>
                  </div>
                  {task?.dueMode && (
                    <div className="flex flex-row rounded-md">
                      <div className="flex flex-col place-content-center">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                      </div>

                      <div className="flex flex-col place-content-center">
                        <div className="text-sm">
                          {task?.dueDate
                            ? format(task.dueDate, "iiii do MMMM HH:mm")
                            : ""}
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
                        {task?.dateRangeFrom
                          ? format(task.dateRangeFrom, "MMM do HH:mm")
                          : ""}{" "}
                        -
                        {task?.dateRangeTo
                          ? format(task?.dateRangeTo, "MMM do HH:mm")
                          : ""}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-2xl font-semibold">{task.name}</div>
              {/* Make it extendable with a label for when its opened by clicking see more */}
              <div className="open:max-h-auto max-h-28">
                {task?.description}
              </div>
            </div>

            {/* Optional based on whether there are images - needs to be a carousel */}
            <div className="border-1 flex h-64 w-full flex-col place-content-center border border-neutral-500 sm:h-auto">
              <span className="text-center">Image</span>
            </div>

            <div className="flex flex-col gap-2">
              {task?.claimedBy?.id && task?.claimedAt && (
                <div className="text-sm font-medium">
                  {task.claimedBy.name} claimed this task on{" "}
                  {format(task.claimedAt, "MMM do HH:mm")}
                </div>
              )}

              {!task?.claimedBy && <div>Unclaimed</div>}

              {task?.markedAsDoneBy?.id && task?.markedAsDoneAt && (
                <div className="text-sm font-medium">
                  {task.markedAsDoneBy.name} completed this task on{" "}
                  {format(task.markedAsDoneAt, "MMM do HH:mm")}
                </div>
              )}

              {!task?.markedAsDoneBy && <div>Incomplete</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
