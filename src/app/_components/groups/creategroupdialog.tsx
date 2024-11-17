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
import { createGroupInputSchema } from "~/lib/schemas/groups";
import { Textarea } from "~/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { type Pet, petListSchema } from "~/lib/schemas/pets";
import { toast } from "sonner";
import { useServerAction } from "zsa-react";
import { createGroupAction } from "~/server/actions/group-actions";

export default function CreateGroupDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  const [pets, setPets] = React.useState<Pet[]>([]);
  const [selectedPetIds, setSelectedPetIds] = React.useState<string[]>([]);
  const [petsEmpty, setPetsEmpty] = React.useState<boolean>(false);

  const form = useForm<z.infer<typeof createGroupInputSchema>>({
    mode: "onBlur",
    resolver: zodResolver(createGroupInputSchema),
    defaultValues: {
      name: "",
      description: "",
      petIds: [],
    },
  });

  const { isPending, execute } = useServerAction(createGroupAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Group created!");
      setOpen(false);
    },
  });

  React.useEffect(() => {
    async function fetchPets() {
      await fetch("/api/owned-pets?all=true")
        .then((res) => res.json())
        .then((data) => petListSchema.safeParse(data))
        .then((validatedPetListObject) => {
          if (!validatedPetListObject.success) {
            console.log(validatedPetListObject.error.message);
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
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-screen w-full overflow-y-scroll rounded-md sm:w-[533px]">
        <DialogHeader>
          <DialogTitle>Group Details</DialogTitle>
          <DialogDescription>
            Create a new group to manage your pets. You must assign pets to the
            group for the group to be able to sit for them.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => execute(values))}
            className="w-full space-y-6"
            name="createPet"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jake's little helpers" {...field} />
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
                    The pets the group will sit for.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={petsEmpty || isPending}>
                Create Group
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {isPending && <p>Creating group...</p>}
      </DialogContent>
    </Dialog>
  );
}
