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
import * as React from "react";
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
import { type SelectGroup } from "~/lib/schemas/groups";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { TimePickerDemo } from "~/components/ui/time-picker-demo";
import { cn } from "~/lib/utils";
import { addYears, format, subDays } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  type CreateTaskFormProps,
  insertTaskSchema,
} from "~/lib/schemas/tasks";
import { useEffect, useState } from "react";
import { createTaskAction } from "~/server/actions/task-actions";
import { toast } from "sonner";
import { useServerAction } from "zsa-react";
import { type SelectBasicPet, petListSchema } from "~/lib/schemas/pets";

export default function CreateTaskDialog({
  groups,
  props,
  children,
}: {
  groups: SelectGroup[];
  props?: CreateTaskFormProps;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState<boolean>(false);

  const [groupPets, setGroupPets] = useState<SelectBasicPet[]>([]);
  const [petsEmpty, setPetsEmpty] = useState<boolean>(false);

  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();

  const [dueMode, setDueMode] = useState<boolean>(true);

  const form = useForm<z.infer<typeof insertTaskSchema>>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      name: "",
      description: "",
      dueMode: props?.dueMode ?? true,
      dueDate: props?.dueMode ? props.dueDate : undefined,
      // Fix this, shouldnt be an object anymore
      dateRangeFrom: props?.dueMode ? undefined : props?.dateRange?.from,
      dateRangeTo: props?.dueMode ? undefined : props?.dateRange?.to,
    },
  });

  const { isPending, execute, error } = useServerAction(createTaskAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Task created!");
      setOpen(false);
      form.reset();
      setSelectedGroupId(undefined);
      setDueMode(true);
      setGroupPets([]);
      setPetsEmpty(false);
    },
  });

  useEffect(() => {
    async function fetchPets() {
      await fetch("../api/group-pets?id=" + form.getValues("groupId"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((json) => petListSchema.safeParse(json))
        .then((validatedPetListObject) => {
          if (!validatedPetListObject.success) {
            throw new Error("Failed to get group's pets");
          }

          if (validatedPetListObject.data.length > 0) {
            setGroupPets(validatedPetListObject.data);
            setPetsEmpty(false);
          } else if (validatedPetListObject.data.length === 0) {
            setGroupPets([]);
            setPetsEmpty(true);
          }
        });
    }

    if (form.getValues("groupId")) {
      void fetchPets();
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (props) {
      form.reset({
        name: props.name,
        description: props.description,
        dueMode: props.dueMode,
        dueDate: props.dueDate,
        dateRange: props.dateRange,
      });
    }
  }, [props]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {/* Don't mess with the height - ideally we want m-5 and h-[svh-5] (and w-[svw-5]) but this doesn't work so sticking with h-5/6 for now which is based on whole page height */}
      <DialogContent className="h-5/6 max-h-svh w-11/12 max-w-[450px] rounded-md sm:h-fit">
        <DialogHeader className="pb-2">
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => execute(values))}
            className="h-full w-full space-y-4 px-1"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Give Jake his dinner" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="The food box is on the dresser in the kitchen. He has three scoops for dinner."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
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
                            form.setValue("dueMode", !dueMode);
                            setDueMode(!dueMode);
                          }}
                        />
                      </FormControl>
                    </div>
                  </div>

                  <FormDescription>
                    Toggle whether the task has a due date/time or is a span of
                    time.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {dueMode && (
              <div className="grid grid-cols-1 gap-2">
                <FormField
                  control={form.control}
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
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            fromDate={subDays(new Date(), 1)}
                            toDate={addYears(new Date(), 1)}
                            disabled={(date) =>
                              date < new Date() && date > new Date("1900-01-01")
                            }
                          />
                          <div className="border-t border-border p-3">
                            <TimePickerDemo
                              setDate={field.onChange}
                              date={field.value}
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
                  control={form.control}
                  name="dateRange.from"
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
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            fromDate={subDays(new Date(), 1)}
                            toDate={addYears(new Date(), 1)}
                            disabled={(date) =>
                              date < new Date() && date > new Date("1900-01-01")
                            }
                          />
                          <div className="border-t border-border p-3">
                            <TimePickerDemo
                              setDate={field.onChange}
                              date={field.value}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateRange.to"
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
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            fromDate={subDays(new Date(), 1)}
                            toDate={addYears(new Date(), 1)}
                            disabled={(date) =>
                              date < new Date() && date > new Date("1900-01-01")
                            }
                          />
                          <div className="border-t border-border p-3">
                            <TimePickerDemo
                              setDate={field.onChange}
                              date={field.value}
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
              control={form.control}
              name="groupId"
              render={({}) => (
                <FormItem>
                  <FormLabel>Group *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      form.setValue("groupId", value);
                      setSelectedGroupId(value);
                    }}
                    disabled={groups.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            groups.length !== 0
                              ? "Select group to associate with task"
                              : "Make a group first"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
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
              control={form.control}
              name="petId"
              render={({}) => (
                <FormItem>
                  <FormLabel>Pet *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      form.setValue("petId", value);
                    }}
                    disabled={petsEmpty || groupPets.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !petsEmpty || groupPets.length !== 0
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

            <DialogFooter className="h-fit">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating Task..." : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {isPending && <div>Creating task...</div>}
        {error && (
          <div>Failed to create task: {JSON.stringify(error.fieldErrors)}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
