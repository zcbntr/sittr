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
import { type Pet, petListSchema } from "~/lib/schemas/pets";
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

  const { isPending, execute } = useServerAction(addPetsToGroupAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Pet added!");
      setOpen(false);
    },
  });

  React.useEffect(() => {
    localStorage.setItem(
      "addPetFormModified",
      form.formState.isDirty.toString(),
    );

    async function fetchPets() {
      await fetch("../api/pets-not-in-group?id=" + groupId)
        .then((res) => res.json())
        .then((data) => petListSchema.safeParse(data))
        .then((validatedPetListObject) => {
          if (!validatedPetListObject.success) {
            throw new Error("Failed to fetch pets");
          }

          if (validatedPetListObject.data.length > 0) {
            setPets(validatedPetListObject.data);
          } else if (validatedPetListObject.data.length === 0) {
            setPetsEmpty(true);
          }
        });
    }

    void fetchPets();
  }, [groupId, form.formState.isDirty]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-screen w-full overflow-y-scroll rounded-md sm:w-[533px]">
        <DialogHeader>
          <DialogTitle>Add Pet(s)</DialogTitle>
          <DialogDescription>
            Pets can be removed from the group at any time.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => execute(values))}
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
                            {
                              pets.find((x) => x.petId == selectedPetIds[0])
                                ?.name
                            }
                          </div>
                        )}
                        {!petsEmpty && selectedPetIds.length === 2 && (
                          <div>
                            {pets.find((x) => x.petId == selectedPetIds[0])
                              ?.name +
                              " and " +
                              pets.find((x) => x.petId == selectedPetIds[1])
                                ?.name}
                          </div>
                        )}
                        {selectedPetIds.length >= 3 && (
                          <div>
                            {pets.find((x) => x.petId == selectedPetIds[0])
                              ?.name +
                              ", " +
                              pets.find((x) => x.petId == selectedPetIds[1])
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
                            checked={selectedPetIds.includes(pet.petId)}
                            onCheckedChange={() => {
                              if (!selectedPetIds.includes(pet.petId)) {
                                setSelectedPetIds([
                                  ...selectedPetIds,
                                  pet.petId,
                                ]);
                                field.onChange([...selectedPetIds, pet.petId]);
                              } else {
                                setSelectedPetIds(
                                  selectedPetIds.filter(
                                    (sId) => sId !== pet.petId,
                                  ),
                                );
                                field.onChange(
                                  selectedPetIds.filter(
                                    (sId) => sId !== pet.petId,
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

        {isPending && <p>Adding pet(s)...</p>}
      </DialogContent>
    </Dialog>
  );
}
