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
import type { SelectBasicTask } from "~/lib/schemas/tasks";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { SelectUser } from "~/lib/schemas/users";
import { TaskEditForm } from "./task-edit-form";

export function TaskOwnerPage({ task, user }: { task: SelectBasicTask; user: SelectUser }) {
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
    <div className="container mx-auto space-y-6 p-4">
      <div className="flex h-full w-full grow flex-row place-content-center">
        {isEditing ? (
          <TaskEditForm task={task} />
        ) : (
          <Card className="w-full max-w-[1000px]">
            <CardContent className="p-8">
              <div className="flex flex-row flex-wrap place-content-center gap-8">
                <div className="flex max-w-[500px] flex-col place-content-between gap-2">
                  <div className="flex flex-col gap-2">
                    <div>
                      {task?.dueMode && (
                        <div>
                          <div className="flex flex-row rounded-md">
                            <div className="flex flex-col place-content-center">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                            </div>

                            <div>
                              {task?.dueDate
                                ? format(task.dueDate, "MMMM do HH:mm")
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
                        <Link href={`/pets/${task?.petId.id}`}>
                          <Avatar>
                            <AvatarImage
                              src={task?.petId.image}
                              alt={`${task?.petId.name}'s avatar`}
                            />
                            {/* Make this actually be the initials rather than first letter */}
                            <AvatarFallback>
                              {task?.petId.name.substring(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex flex-col place-content-center">
                          {task?.petId.name} ({task?.groupId.name})
                        </div>
                      </div>

                      <div>{task?.description}</div>

                      {task?.claimedBy?.id && task?.claimedAt && (
                        <div className="text-sm font-medium">
                          {task.claimedBy.name} claimed this task on{" "}
                          {format(task.claimedAt, "MMM do HH:mm")}
                        </div>
                      )}

                      {task?.markedAsDoneBy?.id && task?.markedAsDoneAt && (
                        <div className="text-sm font-medium">
                          {task.markedAsDoneBy.name} completed this task on{" "}
                          {format(task.markedAsDoneAt, "MMM do HH:mm")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
