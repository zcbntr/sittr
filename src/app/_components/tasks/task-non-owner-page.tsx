"use client";

import { Button } from "~/components/ui/button";
import React from "react";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import { useServerAction } from "zsa-react";
import {
  removeTaskCompletionImageAction,
  setClaimTaskAction,
  setTaskMarkedAsDoneAction,
} from "~/server/actions/task-actions";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  type SelectTask,
  setClaimTaskFormProps,
  setMarkedAsCompleteFormProps,
} from "~/lib/schemas/tasks";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { type SelectUser } from "~/lib/schemas/users";
import Image from "next/image";
import { initials } from "~/lib/utils";
import {
  MdLockOpen,
  MdLockOutline,
  MdOutlineCheck,
  MdOutlineCircle,
  MdPets,
} from "react-icons/md";
import { UploadButton } from "~/lib/uploadthing";
import { Form, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type z } from "zod";

export default function TaskNonOwnerPage({
  task,
  user,
  taskOwner,
}: {
  task: SelectTask;
  user: SelectUser;
  taskOwner: SelectUser;
}) {
  const [completionImageUrls, setCompletionImagesUrls] = React.useState<
    string[]
  >(
    task.completionImages
      ? task.completionImages.map((image) => image.url)
      : [],
  );
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  const claimTaskForm = useForm<z.infer<typeof setClaimTaskFormProps>>({
    resolver: zodResolver(setClaimTaskFormProps),
    defaultValues: {
      id: task?.id,
      claim: task?.claimedById === user?.id,
    },
  });

  const markAsCompleteForm = useForm<
    z.infer<typeof setMarkedAsCompleteFormProps>
  >({
    resolver: zodResolver(setMarkedAsCompleteFormProps),
    defaultValues: {
      id: task?.id,
      markAsDone: task?.markedAsDoneById === user?.id,
    },
  });

  const { isPending: claimPending, execute: claimTask } = useServerAction(
    setClaimTaskAction,
    {
      onError: ({ err }) => {
        toast.error(err.message);
      },
      onSuccess: () => {
        toast.success("Task claimed!");
      },
    },
  );

  const { isPending: markAsDonePending, execute: markTaskAsDone } =
    useServerAction(setTaskMarkedAsDoneAction, {
      onError: ({ err }) => {
        toast.error(err.message);
      },
      onSuccess: () => {
        toast.success("Task marked as done!");
      },
    });

  const { isPending: imageRemovalPending, execute: executeImageRemoval } =
    useServerAction(removeTaskCompletionImageAction, {
      onError: ({ err }) => {
        toast.error(err.message);
      },
      onSuccess: () => {
        toast.success("Image removed!");
      },
    });

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length - 1);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });

    api.on("slidesChanged", () => {
      setCount(api.scrollSnapList().length - 1);
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="mx-auto space-y-6 pb-6 pt-3 sm:container">
      <div className="flex w-full max-w-5xl flex-row px-6 py-3">
        <div className="flex w-full max-w-xl flex-col">
          <div className="flex flex-row place-content-between gap-3">
            <Link
              className="flex flex-col place-content-center"
              href={`/pets/${task?.petId}`}
            >
              {/* Give the avatar a plus badge if the owner has plus */}
              <div className="relative inline-block">
                <Avatar>
                  <AvatarImage
                    src={task?.pet?.profilePic ? task.pet.profilePic.url : ""}
                    alt={`${task?.pet?.name}'s avatar`}
                  />
                  <AvatarFallback>
                    {task?.pet?.name ? (
                      initials(task?.pet?.name ? task.pet.name : "")
                    ) : (
                      <MdPets />
                    )}
                  </AvatarFallback>
                </Avatar>
                {taskOwner.plan === "Plus" && (
                  <div className="absolute right-0 top-0 -mr-1 -mt-1 flex h-5 w-5 items-center justify-center text-2xl font-bold text-violet-500">
                    +
                  </div>
                )}
                {taskOwner.plan === "Pro" && (
                  <div className="absolute right-0 top-0 -mr-1 -mt-1 flex h-5 w-5 items-center justify-center text-xl font-bold text-violet-500">
                    Pro
                  </div>
                )}
              </div>
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
                <div className="flex flex-row place-content-center">
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
                <div className="flex flex-row place-content-center">
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

          <div className="mt-[-6px] flex flex-col gap-1">
            <div className="text-2xl font-semibold">{task.name}</div>
            {/* Make it extendable with a label for when its opened by clicking see more */}
            <div className="open:max-h-auto max-h-28">{task?.description}</div>
          </div>

          {task?.instructionImages && (
            <div className="flex flex-row place-content-center">
              <Carousel className="h-fit max-h-64 min-h-64 max-w-full rounded-md sm:max-h-96">
                <CarouselContent className="-ml-4 max-h-96 min-h-64 max-w-full pl-6 pr-4">
                  {task.instructionImages.map((image, index) => (
                    <CarouselItem
                      key={index}
                      className="flex h-full w-full flex-col place-content-center rounded-md border border-input"
                    >
                      <Image
                        width={375}
                        height={270}
                        src={image.url}
                        alt={`Instruction image ${index}`}
                        className="h-full w-auto max-w-full rounded-md object-cover"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:block" />
                <CarouselNext className="hidden sm:block" />
              </Carousel>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Form {...claimTaskForm}>
                <form onSubmit={claimTaskForm.handleSubmit(claimTask)}>
                  <Button
                    className="h-fit w-full"
                    disabled={
                      (!claimTaskForm.getValues("id") ||
                        (task?.claimedBy && task.claimedBy?.id !== user?.id)) ??
                      (markAsDonePending || claimPending)
                    }
                    type="submit"
                  >
                    {task?.claimedBy && task.claimedBy?.id !== user?.id && (
                      <div className="flex flex-row flex-nowrap">
                        <div className="flex flex-col place-content-center">
                          <MdLockOutline className="mr-1 h-4 w-4" />
                        </div>

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
                    )}
                    {task?.claimedBy && task.claimedBy?.id === user?.id && (
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
                  onSubmit={markAsCompleteForm.handleSubmit(markTaskAsDone)}
                >
                  <Button
                    className="h-fit w-full"
                    disabled={
                      (!markAsCompleteForm.getValues("id") ||
                        (task?.markedAsDoneBy &&
                          task.markedAsDoneBy?.id !== user?.id)) ??
                      (markAsDonePending || claimPending)
                    }
                    type="submit"
                  >
                    {task?.markedAsDoneBy &&
                      task.markedAsDoneBy?.id !== user?.id && (
                        <div className="flex flex-row flex-nowrap">
                          <div className="flex flex-col place-content-center">
                            <MdOutlineCheck className="mr-1 h-4 w-4" />
                          </div>

                          <div className="flex flex-col">
                            <div className="text-center text-sm text-muted-foreground">
                              Completed by
                            </div>
                            {task.markedAsDoneBy && (
                              <div className="text-lg">
                                {task.markedAsDoneBy?.name}
                              </div>
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
                      )}
                    {task?.markedAsDoneBy &&
                      task.markedAsDoneBy?.id === user?.id && (
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

          {(taskOwner.plan === "Plus" || taskOwner.plan === "Pro") && (
            <div className="flex flex-col">
              <Carousel
                setApi={setApi}
                className="h-fit max-h-96 min-h-64 max-w-full rounded-md"
              >
                <CarouselContent className="-ml-4 max-h-96 min-h-64 max-w-full pl-6 pr-4">
                  {completionImageUrls.map((url, index) => (
                    <CarouselItem key={index} className="pl-4">
                      <div className="flex h-full w-full flex-col place-content-center rounded-md border border-input">
                        <Image
                          width={375}
                          height={270}
                          src={url}
                          alt={`Instruction image ${index}`}
                          className="h-full max-h-96 w-auto max-w-full rounded-md object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                  {completionImageUrls.length < 10 && (
                    <CarouselItem className="flex grow pl-4">
                      <div className="flex min-w-[180px] grow flex-col place-content-center">
                        {/* User must first claim the task before uploading images */}
                        <UploadButton
                          disabled={
                            (!claimTaskForm.getValues("id") ||
                              (task?.claimedBy &&
                                task.claimedBy?.id !== user?.id)) ??
                            (markAsDonePending || claimPending)
                          }
                          endpoint="createTaskCompletionImageUploader"
                          input={{ taskId: task.id }}
                          onClientUploadComplete={(res) => {
                            // Do something with the response
                            if (res[0]?.serverData.url)
                              setCompletionImagesUrls([
                                ...completionImageUrls,
                                res[0].serverData.url,
                              ]);
                            else toast.error("Image Upload Error!");
                          }}
                          onUploadError={(error: Error) => {
                            // Do something with the error.
                            toast.error(`Image Upload Error! ${error.message}`);
                          }}
                        />
                      </div>
                    </CarouselItem>
                  )}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:block" />
                <CarouselNext className="hidden sm:block" />
              </Carousel>

              <div className="flex flex-row place-content-between">
                <div className="h-9 w-1"></div>

                {count > 0 && current != count && (
                  <Button
                    disabled={imageRemovalPending}
                    variant={"link"}
                    className="text-center text-sm text-muted-foreground"
                    onClick={async () => {
                      if (!completionImageUrls[current] || !api) return;

                      await executeImageRemoval({
                        id: task.id,
                        imageUrl: completionImageUrls[current],
                      });

                      completionImageUrls.splice(current, 1);
                      setCount(api?.scrollSnapList.length - 1);
                      setCurrent(api.selectedScrollSnap());
                    }}
                  >
                    Remove
                  </Button>
                )}

                {current != count && (
                  <div className="flex flex-col place-content-center p-2 text-sm text-muted-foreground">
                    <span className="flex flex-row place-content-end">
                      {current + 1}/10
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {task.completedAt &&
            !task?.completionImages &&
            (taskOwner.plan === "Plus" || taskOwner.plan === "Pro") && (
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
            taskOwner.plan === "Free" && (
              <div className="border-1 flex h-64 max-w-full flex-row place-content-center rounded-md border border-neutral-500 px-20 sm:h-auto">
                <div className="flex flex-col place-content-center">
                  <div className="text-center text-muted-foreground">
                    The task owner needs to upgrade to{" "}
                    <span className="font-bold">
                      sittr
                      <sup className="text-violet-500 opacity-70">+</sup>
                    </span>{" "}
                    to enable completion images.
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
