"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import * as React from "react";
import { type z } from "zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { type Pet } from "~/lib/schemas/pets";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { petsToGroupFormInputSchema } from "~/lib/schemas/groups";
import { useServerAction } from "zsa-react";
import { addPetsToGroupAction } from "~/server/actions/group-actions";
import { toast } from "sonner";

export default function AddPetToGroupDialog({
  groupId,
  petsNotInGroup,
  children,
}: {
  groupId: string;
  petsNotInGroup: Pet[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  const [selectedPetIds, setSelectedPetIds] = React.useState<string[]>([]);

  const form = useForm<z.infer<typeof petsToGroupFormInputSchema>>({
    resolver: zodResolver(petsToGroupFormInputSchema),
    defaultValues: {
      groupId: groupId,
      petIds: [],
    },
  });

  const { isPending, execute } = useServerAction(addPetsToGroupAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Pet added!");
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-dvw h-min max-h-svh w-11/12 gap-4 rounded-md sm:w-[533px]">
        <DialogHeader className="pb-2">
          <DialogTitle>Add Pet(s) *</DialogTitle>
          <DialogDescription>
            Pets can be removed from the group at any time.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => execute(values))}
            className="my-5 w-full space-y-6"
            name="createPet"
          >
            <FormField
              control={form.control}
              name="petIds"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      disabled={petsNotInGroup.length === 0}
                      asChild
                    >
                      <Button variant="outline">
                        {/* Probably a better way of doing this */}
                        {petsNotInGroup.length > 0 &&
                          selectedPetIds.length === 0 && <div>None</div>}
                        {petsNotInGroup.length > 0 &&
                          selectedPetIds.length === 1 && (
                            <div>
                              {
                                petsNotInGroup.find(
                                  (x) => x.id == selectedPetIds[0],
                                )?.name
                              }
                            </div>
                          )}
                        {petsNotInGroup.length > 0 &&
                          selectedPetIds.length === 2 && (
                            <div>
                              {petsNotInGroup.find(
                                (x) => x.id == selectedPetIds[0],
                              )?.name +
                                " and " +
                                petsNotInGroup.find(
                                  (x) => x.id == selectedPetIds[1],
                                )?.name}
                            </div>
                          )}
                        {selectedPetIds.length >= 3 && (
                          <div>
                            {petsNotInGroup.find(
                              (x) => x.id == selectedPetIds[0],
                            )?.name +
                              ", " +
                              petsNotInGroup.find(
                                (x) => x.id == selectedPetIds[1],
                              )?.name +
                              ", and " +
                              (selectedPetIds.length - 2).toString() +
                              " more"}
                          </div>
                        )}
                        {petsNotInGroup.length === 0 && (
                          <div>Nothing to display</div>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {petsNotInGroup.map(function (pet, i) {
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
                                field.onChange([...selectedPetIds, pet.id]);
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
                    Choose additional pets for the group to sit for.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  petsNotInGroup.length === 0 || selectedPetIds.length == 0
                }
              >
                {selectedPetIds.length <= 1 && <div>Add Pet</div>}
                {selectedPetIds.length > 1 && <div>Add Pets</div>}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {isPending && <p>Adding pet(s)...</p>}
      </DialogContent>
    </Dialog>
  );
}
