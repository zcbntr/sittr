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
import {
  createGroupFormSchema,
  groupSchema,
  type Pet,
  petListSchema,
} from "~/lib/schema/index";
import { Textarea } from "~/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export default function CreateGroupDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  const [pets, setPets] = React.useState<Pet[]>([]);
  const [selectedPetIds, setSelectedPetIds] = React.useState<number[]>([]);
  const [petsEmpty, setPetsEmpty] = React.useState<boolean>(false);

  const form = useForm<z.infer<typeof createGroupFormSchema>>({
    resolver: zodResolver(createGroupFormSchema),
  });

  React.useEffect(() => {
    async function fetchPets() {
      await fetch("api/pets?all=true", {
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

    void fetchPets();
  }, []);

  async function onSubmit(data: z.infer<typeof createGroupFormSchema>) {
    await fetch("/api/groups", {
      method: "PUT",
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
          throw new Error("Failed to create group");
        }

        document.dispatchEvent(new Event("groupCreated"));
        setOpen(false);
        return;
      });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[454px]">
        <DialogHeader>
          <DialogTitle>Group Details</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-2/3 space-y-6"
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
                      {pets.map(function (subject, i) {
                        return (
                          <DropdownMenuCheckboxItem
                            key={i}
                            checked={selectedPetIds.includes(subject.id)}
                            onCheckedChange={() => {
                              if (!selectedPetIds.includes(subject.id)) {
                                setSelectedPetIds([
                                  ...selectedPetIds,
                                  subject.id,
                                ]);
                                field.onChange([...selectedPetIds, subject.id]);
                              } else {
                                setSelectedPetIds(
                                  selectedPetIds.filter(
                                    (sId) => sId !== subject.id,
                                  ),
                                );
                                field.onChange(
                                  selectedPetIds.filter(
                                    (sId) => sId !== subject.id,
                                  ),
                                );
                              }
                            }}
                          >
                            {subject.name}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <FormDescription>
                    Who or what the group will sit for.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={petsEmpty}>
                Create Group
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
