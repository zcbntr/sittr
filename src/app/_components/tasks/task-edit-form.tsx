"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { SelectTask, updateTaskSchema } from "~/lib/schemas/tasks";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { addYears, format, subDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { useServerAction } from "zsa-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { UploadButton } from "~/lib/uploadthing";
import { Textarea } from "~/components/ui/textarea";
import {
  removeTaskInstructionImageAction,
  updateTaskAction,
} from "~/server/actions/task-actions";
import { Switch } from "~/components/ui/switch";
import { type SelectBasicPet, selectPetListSchema } from "~/lib/schemas/pets";
import { TimePickerDemo } from "~/components/ui/time-picker-demo";
import { type SelectBasicGroup } from "~/lib/schemas/groups";
import { MdCancel, MdEdit } from "react-icons/md";
import { SelectBasicUser } from "~/lib/schemas/users";
import Link from "next/link";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";

export function TaskEditForm({
  task,
  user,
  userGroups,
}: {
  task: SelectTask;
  user: SelectBasicUser;
  userGroups: SelectBasicGroup[];
}) {
  const [instructionImageUrls, setInstructionImagesUrls] = React.useState<
    string[]
  >(
    task.instructionImages
      ? task.instructionImages.map((image) => image.url)
      : [],
  );
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  const [groupPets, setGroupPets] = useState<SelectBasicPet[]>([]);
  const [petsEmpty, setPetsEmpty] = useState<boolean>(false);

  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(
    undefined,
  );
  const [dueMode, setDueMode] = useState<boolean>(true);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function exitEditMode() {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("editing");

    router.replace(`${pathname}?${nextSearchParams}`);
    router.refresh();
  }

  const updateForm = useForm<z.infer<typeof updateTaskSchema>>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      id: task?.id,
      name: task?.name,
      description: task?.description ? task.description : undefined,
      dueMode: task?.dueMode,
      dueDate: task?.dueDate ? task.dueDate : undefined,
      dateRangeFrom: task?.dateRangeFrom ? task.dateRangeFrom : undefined,
      dateRangeTo: task?.dateRangeTo ? task.dateRangeTo : undefined,
      groupId: task?.groupId ? task.groupId : undefined,
      petId: task?.petId ? task.petId : undefined,
    },
  });

  const { isPending: updatePending, execute: executeUpdate } = useServerAction(
    updateTaskAction,
    {
      onError: ({ err }) => {
        toast.error(err.message);
      },
      onSuccess: () => {
        toast.success("Task details updated!");
        exitEditMode();
      },
    },
  );

  const { isPending: imageRemovalPending, execute: executeImageRemoval } =
    useServerAction(removeTaskInstructionImageAction, {
      onError: ({ err }) => {
        toast.error(err.message);
      },
      onSuccess: () => {
        toast.success("Image removed!");
      },
    });

  useEffect(() => {
    setSelectedGroupId(
      updateForm.getValues("groupId")
        ? updateForm.getValues("groupId")
        : task?.groupId
          ? task.groupId
          : "",
    );

    async function fetchGroupPets() {
      let groupId = updateForm.getValues("groupId");

      if (!groupId && task.groupId) {
        groupId = task.groupId;
      } else if (!groupId) {
        throw new Error("No group ID found");
      }

      await fetch("../api/group-pets?id=" + updateForm.getValues("groupId"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((json) => selectPetListSchema.safeParse(json))
        .then((validatedPetListObject) => {
          if (!validatedPetListObject.success) {
            console.log(validatedPetListObject.error);
            throw new Error("Failed to get group's pets");
          }

          if (validatedPetListObject.data.length > 0) {
            setGroupPets(validatedPetListObject.data);
          } else if (validatedPetListObject.data.length === 0) {
            setPetsEmpty(true);
          }
        });
    }

    // Fetch all possible sitting pets
    if (task) {
      void fetchGroupPets();
    }
  }, [task, selectedGroupId]);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <div className="w-full max-w-[1000px] sm:w-full">
      <Form {...updateForm}>
        <form
          onSubmit={updateForm.handleSubmit((values) => executeUpdate(values))}
          className="space-y-2"
        >
          <div className="flex flex-col gap-4">
            <FormField
              control={updateForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Give Jake his dinner" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={updateForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="The food box is on the dresser in the kitchen. He has three scoops for dinner."
                      {...field}
                      className="min-h-32"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {user.plusMembership && (
              <div className="flex flex-col gap-1">
                <Carousel
                  setApi={setApi}
                  className="h-64 max-h-64 max-w-full rounded-md border border-input px-20"
                >
                  <CarouselContent className="-ml-4 h-64 max-h-64 max-w-full">
                    {instructionImageUrls.map((url, index) => (
                      <CarouselItem key={index} className="rounded-md pl-4">
                        <div className="h-64 w-full">
                          {" "}
                          <img
                            src={url}
                            alt={`Instruction image ${index}`}
                            className="h-auto max-w-full"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                    {instructionImageUrls.length < 10 && (
                      <CarouselItem className="flex grow pl-4">
                        <div className="flex min-w-[180px] grow flex-col place-content-center">
                          <UploadButton
                            endpoint="createTaskInstructionImageUploader"
                            input={{ taskId: task.id }}
                            onClientUploadComplete={(res) => {
                              // Do something with the response
                              if (res[0]?.serverData.url)
                                setInstructionImagesUrls([
                                  ...instructionImageUrls,
                                  res[0].serverData.url,
                                ]);
                              else toast.error("Image Upload Error!");
                            }}
                            onUploadError={(error: Error) => {
                              // Do something with the error.
                              toast.error(
                                `Image Upload Error! ${error.message}`,
                              );
                            }}
                          />
                        </div>
                      </CarouselItem>
                    )}
                  </CarouselContent>
                  <CarouselPrevious className="hidden sm:block" />
                  <CarouselNext className="hidden sm:block" />
                </Carousel>
                {/* Use carousel API to determine which image is being shown and give option to delete */}
                {instructionImageUrls.length > 0 && (
                  <Button
                    disabled={imageRemovalPending}
                    variant={"link"}
                    className="text-center text-sm text-muted-foreground"
                    onClick={async () => {
                      if (
                        instructionImageUrls.length === 0 ||
                        instructionImageUrls[current] === undefined
                      ) {
                        return;
                      }

                      await executeImageRemoval({
                        id: task.id,
                        imageUrl: instructionImageUrls[current],
                      });

                      instructionImageUrls.splice(current, 1);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            )}

            {!user.plusMembership && (
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

            <div className="flex flex-col gap-3">
              <div className="mb-[-6px] font-semibold">Details</div>
              <FormField
                control={updateForm.control}
                name="dueMode"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-between pr-1">
                    <div className="flex flex-row gap-3">
                      <div className="flex flex-col place-content-center">
                        <FormLabel className="">Span Time Period</FormLabel>
                      </div>

                      <div className="flex flex-col place-content-center">
                        <FormControl>
                          <Switch
                            checked={!field.value}
                            onCheckedChange={() => {
                              updateForm.setValue("dueMode", !dueMode);
                              setDueMode(!dueMode);
                            }}
                          />
                        </FormControl>
                      </div>
                    </div>

                    <FormDescription className="text-pretty">
                      Toggle whether the task has a due date/time or spans time.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {dueMode && (
                <div className="grid grid-cols-1 gap-2">
                  <FormField
                    control={updateForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-left">
                          Due Date/Time *
                        </FormLabel>
                        <Popover modal={true}>
                          <FormControl>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "MMMM do HH:mm")
                                ) : (
                                  <span>Pick a due date & time</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                          </FormControl>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value ? field.value : undefined}
                              onSelect={field.onChange}
                              initialFocus
                              fromDate={subDays(new Date(), 1)}
                              toDate={addYears(new Date(), 1)}
                              disabled={(date) =>
                                date < new Date() &&
                                date > new Date("1900-01-01")
                              }
                            />
                            <div className="border-t border-border p-3">
                              <TimePickerDemo
                                setDate={field.onChange}
                                date={field.value ? field.value : undefined}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {!dueMode && (
                <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2">
                  <FormField
                    control={updateForm.control}
                    name="dateRangeFrom"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-left">
                          Start Date/Time *
                        </FormLabel>
                        <Popover modal={true}>
                          <FormControl>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "MMM do HH:mm")
                                ) : (
                                  <span>Pick a start date & time</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                          </FormControl>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value ? field.value : undefined}
                              onSelect={field.onChange}
                              initialFocus
                              fromDate={subDays(new Date(), 1)}
                              toDate={addYears(new Date(), 1)}
                              disabled={(date) =>
                                date < new Date() &&
                                date > new Date("1900-01-01")
                              }
                            />
                            <div className="border-t border-border p-3">
                              <TimePickerDemo
                                setDate={field.onChange}
                                date={field.value ? field.value : undefined}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={updateForm.control}
                    name="dateRangeTo"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-left">
                          End Date/Time *
                        </FormLabel>
                        <Popover modal={true}>
                          <FormControl>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "MMM do HH:mm")
                                ) : (
                                  <span>Pick a end date & time</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                          </FormControl>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value ? field.value : undefined}
                              onSelect={field.onChange}
                              initialFocus
                              fromDate={subDays(new Date(), 1)}
                              toDate={addYears(new Date(), 1)}
                              disabled={(date) =>
                                date < new Date() &&
                                date > new Date("1900-01-01")
                              }
                            />
                            <div className="border-t border-border p-3">
                              <TimePickerDemo
                                setDate={field.onChange}
                                date={field.value ? field.value : undefined}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={updateForm.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        updateForm.setValue("groupId", value);
                        setSelectedGroupId(value);
                      }}
                      disabled={userGroups.length === 0}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              userGroups.length !== 0
                                ? "Select group to associate with task"
                                : "Make a group first"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userGroups.map((group) => (
                          <SelectItem
                            key={group.id}
                            value={group.id.toString()}
                          >
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="petId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pet *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        updateForm.setValue("petId", value);
                      }}
                      disabled={petsEmpty || groupPets.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              task.pet?.name
                                ? task.pet.name
                                : !petsEmpty || groupPets.length !== 0
                                  ? "Select a pet assigned to the group"
                                  : "Choose a group with pets assigned"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groupPets.map((pet) => (
                          <SelectItem key={pet.id} value={pet.id.toString()}>
                            {pet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-row gap-2 pt-2">
                <Button type="submit" disabled={updatePending}>
                  <div className="flex flex-row gap-2">
                    <div className="flex flex-col place-content-center">
                      <MdEdit size={"1.2rem"} />
                    </div>
                    {updatePending ? "Updating Pet..." : "Update Pet"}
                  </div>
                </Button>

                <Button
                  type="reset"
                  onClick={exitEditMode}
                  disabled={updatePending}
                >
                  <div className="flex flex-row gap-2">
                    <div className="flex flex-col place-content-center">
                      <MdCancel size={"1.2rem"} />
                    </div>
                    Cancel
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
