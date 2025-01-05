"use client";

import { Button } from "~/components/ui/button";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MdEdit } from "react-icons/md";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
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
import Image from "next/image";

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

  return (
    <div className="mx-auto space-y-6 sm:container">
      {isEditing ? (
        <div className="flex w-full max-w-5xl flex-row place-content-center px-6 py-4">
          <div className="flex w-full max-w-xl flex-col gap-4">
            <TaskEditForm task={task} user={user} userGroups={userGroups} />
          </div>
        </div>
      ) : (
        <div className="flex w-full max-w-5xl flex-row place-content-center px-6 py-3">
          <div className="flex w-full max-w-xl flex-col gap-4">
            <div className="flex flex-row place-content-between gap-3">
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
              <div className="flex flex-col place-content-center">
                <Button
                  asChild
                  variant={"ghost"}
                  onClick={() => router.replace("?editing=true")}
                  className="px-0"
                >
                  <MdEdit size={"3em"} />
                </Button>
              </div>
            </div>

            <div className="mt-[-6px] flex flex-col gap-1">
              <div className="text-2xl font-semibold">{task.name}</div>
              {/* Make it extendable with a label for when its opened by clicking see more */}
              <div className="open:max-h-auto max-h-28">
                {task?.description}
              </div>
            </div>

            {task?.instructionImages && (
              <div className="flex flex-row place-content-center">
                <Carousel className="max-h-64 max-w-full sm:h-auto">
                  <CarouselContent>
                    {task.instructionImages.map((image, index) => (
                      <CarouselItem key={index} className="">
                        {/* Fix width here */}
                        <div className="h-64 w-[calc(100vw-8rem)] max-w-[calc(100vw-8rem)]">
                          <Image
                            fill
                            className="rounded-md object-cover"
                            src={image.url}
                            alt={`Instruction image ${index}`}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden sm:block" />
                  <CarouselNext className="hidden sm:block" />
                </Carousel>
              </div>
            )}

            {!task?.instructionImages && user.plusMembership && (
              <div className="border-1 flex h-64 max-w-full flex-row place-content-center rounded-md border border-input px-20 sm:h-auto">
                <div className="flex flex-col place-content-center">
                  <Button
                    variant={"link"}
                    onClick={() => router.replace("?editing=true")}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Add images to your tasks
                  </Button>
                </div>
              </div>
            )}

            {!task?.instructionImages && !user.plusMembership && (
              <div className="border-1 flex h-64 max-w-full flex-row place-content-center rounded-md border border-input px-20 sm:h-auto">
                <div className="flex flex-col place-content-center">
                  <Link
                    href={"/plus"}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Get{" "}
                    <span className="font-bold">
                      sittr
                      <sup className="text-violet-600 opacity-70">+</sup>
                    </span>{" "}
                    to add images to your tasks
                  </Link>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-row place-content-center">
                  <div className="flex flex-col">
                    <div className="text-center text-sm text-muted-foreground">
                      Claimed by
                    </div>
                    {task.claimedBy && (
                      <div className="text-lg">{task.claimedBy.name}</div>
                    )}
                    {!task?.claimedBy && (
                      <div className="text-lg">Unclaimed</div>
                    )}
                    {task.claimedAt && (
                      <div className="text-md text-muted-foreground">
                        {format(task.claimedAt, "MMM do HH:mm")}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-row place-content-center">
                  <div className="flex flex-col">
                    <div className="text-center text-sm text-muted-foreground">
                      Completed by
                    </div>
                    {task.markedAsDoneBy && (
                      <div className="text-lg">{task.markedAsDoneBy?.name}</div>
                    )}
                    {!task?.markedAsDoneBy && (
                      <div className="text-lg">Not complete</div>
                    )}
                    {task.markedAsDoneAt && (
                      <div className="text-md text-muted-foreground">
                        {format(task.markedAsDoneAt, "MMM do HH:mm")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {task.completedAt && task?.completionImages && (
              <div className="flex flex-row place-content-center">
                <Carousel className="max-h-64 max-w-full px-20 sm:h-auto">
                  <CarouselContent>
                    {task.completionImages.map((image, index) => (
                      <CarouselItem key={index} className="rounded-md">
                        <img
                          src={image.url}
                          alt={`Completion image ${index}`}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden sm:block" />
                  <CarouselNext className="hidden sm:block" />
                </Carousel>
              </div>
            )}

            {task.completedAt &&
              !task?.completionImages &&
              user.plusMembership && (
                <div className="border-1 flex h-64 max-w-full flex-row place-content-center rounded-md border border-neutral-500 px-20 sm:h-auto">
                  <div className="flex flex-col place-content-center">
                    <div className="text-center text-muted-foreground">
                      No Completion Images
                    </div>
                  </div>
                </div>
              )}

            {task.completedAt &&
              !task?.completionImages &&
              !user.plusMembership && (
                <div className="border-1 flex h-64 max-w-full flex-row place-content-center rounded-md border border-neutral-500 px-20 sm:h-auto">
                  <div className="flex flex-col place-content-center">
                    <div className="text-center text-muted-foreground">
                      No Completion Images. Upgrade to Plus to let your sitter
                      upload images to show they have completed the task to your
                      satisfaction.
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
