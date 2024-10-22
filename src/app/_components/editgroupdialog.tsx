// Do no use this, instead use some of its code to make a specific edit page

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
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { type DateRange } from "react-day-picker";
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
import {
  editGroupFormSchema,
  Group,
  groupListSchema,
  groupSchema,
  Pet,
  petListSchema,
} from "~/lib/schema/index";
import { TimePickerDemo } from "~/components/ui/time-picker-demo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export default function EditGroupDialog({
  props,
  children,
}: {
  props?: Group;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState<boolean>(false);
  const [dataChanged, setDataChanged] = React.useState<boolean>(false);

  const [pets, setPets] = React.useState<Pet[]>([]);
  const [selectedPetIds, setSelectedPetIds] = React.useState<number[]>([]);
  const [petsEmpty, setPetsEmpty] = React.useState<boolean>(false);

  const [deleteClicked, setDeleteClicked] = React.useState<boolean>(false);

  const form = useForm<z.infer<typeof editGroupFormSchema>>({
    resolver: zodResolver(editGroupFormSchema),
  });

  // Update state upon props change, Update form value upon props change
  React.useEffect(
    () => {
      async function fetchPets() {
        await fetch("api/pets?all=true", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((res) => res.json())
          .then((json) => petListSchema.safeParse(json))
          .then((validatedPetListObject) => {
            if (!validatedPetListObject.success) {
              console.error(validatedPetListObject.error.message);
              throw new Error("Failed to get sitting pets");
            }

            if (validatedPetListObject.data.length > 0) {
              setPets(validatedPetListObject.data);
            } else if (validatedPetListObject.data.length === 0) {
              setPetsEmpty(true);
            }
          });
      }

      if (props) {
        if (props?.id) {
          form.setValue("id", props.id);
        }

        if (props?.description) {
          form.setValue("description", props.description);
        }

        if (props?.members) {
          form.setValue(
            "memberIds",
            props.members.map((m) => m.userId),
          );
        }
      }

      void fetchPets();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props],
  );

  async function onSubmit(data: z.infer<typeof editGroupFormSchema>) {
    if (deleteClicked) {
      await deleteGroup();
      return;
    }

    await fetch("/api/group", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((json) => groupSchema.safeParse(json))
      .then((validatedGroupObject) => {
        if (!validatedGroupObject.success) {
          console.error(validatedGroupObject.error.message);
          throw new Error("Failed to updated group");
        }

        document.dispatchEvent(new Event("groupUpdated"));
        setOpen(false);
        return;
      });
  }

  async function deleteGroup() {
    // Fix this at some point with another dialog
    // eslint-disable-next-line no-alert
    if (window.confirm("Are you sure you want to delete this group?")) {
      await fetch("api/group", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: form.getValues().id }),
      })
        .then((res) => res.json())
        .then((json) => groupSchema.safeParse(json))
        .then((validatedGroupObject) => {
          if (!validatedGroupObject.success) {
            console.error(validatedGroupObject.error.message);
            throw new Error("Failed to delete group");
          }

          document.dispatchEvent(new Event("groupDeleted"));
          setOpen(false);
          return;
        });
    }

    setDeleteClicked(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[454px]">
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void onSubmit(form.getValues());
            }}
            onChange={() => setDataChanged(true)}
            className="w-full space-y-6"
            name="editTask"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
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
                      placeholder="Friends who can pop round to feed Jake while we are away"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the group and its purpose. This will be visible to
                    users who join the group.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="petIds"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Sitting For</FormLabel>
                  <DropdownMenu>
                    <DropdownMenuTrigger disabled={petsEmpty} asChild>
                      <Button variant="outline">
                        {/* Probably a better way of doing this */}
                        {!petsEmpty && selectedPetIds.length === 0 && (
                          <div>None</div>
                        )}
                        {!petsEmpty && selectedPetIds.length === 1 && (
                          <div>
                            {
                              pets.find((x) => x.id == selectedPetIds[0])
                                ?.name
                            }
                          </div>
                        )}
                        {!petsEmpty && selectedPetIds.length === 2 && (
                          <div>
                            {pets.find((x) => x.id == selectedPetIds[0])
                              ?.name +
                              " and " +
                              pets.find((x) => x.id == selectedPetIds[1])
                                ?.name}
                          </div>
                        )}
                        {selectedPetIds.length >= 3 && (
                          <div>
                            {pets.find((x) => x.id == selectedPetIds[0])
                              ?.name +
                              ", " +
                              pets.find((x) => x.id == selectedPetIds[1])
                                ?.name +
                              ", and " +
                              (selectedPetIds.length - 2).toString() +
                              " more"}
                          </div>
                        )}
                        {petsEmpty && <div>Nothing to display</div>}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {pets.map(function (pet, i) {
                        return (
                          <DropdownMenuCheckboxItem
                            key={i}
                            checked={selectedPetIds.includes(pet.id)}
                            onCheckedChange={() => {
                              if (!selectedPetIds.includes(pet.id)) {
                                setSelectedPetIds([
                                  ...selectedPetIds,
                                  pet.id,
                                ]);
                                field.onChange([
                                  ...selectedPetIds,
                                  pet.id,
                                ]);
                              } else {
                                setSelectedPetIds(
                                  selectedPetIds.filter(
                                    (sId) => sId !== pet.id,
                                  ),
                                );
                                field.onChange(
                                  selectedPetIds.filter(
                                    (sId) => sId !== pet.id,
                                  ),
                                );
                              }
                            }}
                          >
                            {pet.name}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <FormDescription>
                    Who the group will sit for.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <div className="flex grow flex-row place-content-between">
                <Button
                  id="deleteGroupButton"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    setDeleteClicked(true);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#e8eaed"
                  >
                    <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                  </svg>
                </Button>
                <Button type="submit" disabled={!dataChanged}>
                  Update Group
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
