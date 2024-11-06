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
import { type Pet, petListSchema } from "~/lib/schemas/pets";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { petsToGroupFormInputSchema } from "~/lib/schemas";
import { petToGroupListSchema } from "~/lib/schemas/groups";

export default function AddPetToGroupDialog({
  groupId,
  children,
}: {
  groupId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  const [pets, setPets] = React.useState<Pet[]>([]);
  const [selectedPetIds, setSelectedPetIds] = React.useState<string[]>([]);
  const [petsEmpty, setPetsEmpty] = React.useState<boolean>(false);

  const form = useForm<z.infer<typeof petsToGroupFormInputSchema>>({
    resolver: zodResolver(petsToGroupFormInputSchema),
    defaultValues: {
      groupId: groupId,
      petIds: [],
    },
  });

  React.useEffect(() => {
    async function fetchPets() {
      await fetch("../api/pets-not-in-group?id=" + groupId, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => petListSchema.safeParse(data))
        .then((validatedPetListObject) => {
          if (!validatedPetListObject.success) {
            console.error(validatedPetListObject.error.message);
            throw new Error("Failed to fetch pets");
          }

          if (validatedPetListObject.data.length > 0) {
            setPets(validatedPetListObject.data);
          } else if (validatedPetListObject.data.length === 0) {
            setPetsEmpty(true);
          }
        });
    }

    document.addEventListener("petRemoved", () => {
      void fetchPets();
    });

    void fetchPets();
  }, [groupId]);

  async function onSubmit(data: z.infer<typeof petsToGroupFormInputSchema>) {
    await fetch("../api/group-pets", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((json) => petToGroupListSchema.safeParse(json))
      .then((validatedPetToGroupListObject) => {
        if (!validatedPetToGroupListObject.success) {
          console.error(validatedPetToGroupListObject.error.message);
          throw new Error("Failed to add pets to group");
        }

        document.dispatchEvent(new Event("petsUpdated"));
        setOpen(false);
        form.setValue("petIds", []);
        return;
      });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>Add Pet(s)</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-2/3 space-y-6"
            name="createPet"
          >
            <FormField
              control={form.control}
              name="petIds"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <DropdownMenu>
                    <DropdownMenuTrigger disabled={petsEmpty} asChild>
                      <Button variant="outline">
                        {/* Probably a better way of doing this */}
                        {!petsEmpty && selectedPetIds.length === 0 && (
                          <div>None</div>
                        )}
                        {!petsEmpty && selectedPetIds.length === 1 && (
                          <div>
                            {pets.find((x) => x.id == selectedPetIds[0])?.name}
                          </div>
                        )}
                        {!petsEmpty && selectedPetIds.length === 2 && (
                          <div>
                            {pets.find((x) => x.id == selectedPetIds[0])?.name +
                              " and " +
                              pets.find((x) => x.id == selectedPetIds[1])?.name}
                          </div>
                        )}
                        {selectedPetIds.length >= 3 && (
                          <div>
                            {pets.find((x) => x.id == selectedPetIds[0])?.name +
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
                                setSelectedPetIds([...selectedPetIds, pet.id]);
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
                disabled={petsEmpty || selectedPetIds.length == 0}
              >
                {selectedPetIds.length <= 1 && <div>Add Pet</div>}
                {selectedPetIds.length > 1 && <div>Add Pets</div>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
