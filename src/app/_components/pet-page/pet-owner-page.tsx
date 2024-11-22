"use client";

import { Button } from "~/components/ui/button";
import { PetEditForm } from "~/app/_components/pet-page/pet-edit-form";
import { type Pet } from "~/lib/schemas/pets";
import { Card, CardContent } from "~/components/ui/card";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MdDelete, MdEdit } from "react-icons/md";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { useServerAction } from "zsa-react";
import { deletePetAction } from "~/server/actions/pet-actions";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Textarea } from "~/components/ui/textarea";
import { getPetAgeString } from "~/lib/utils";

export function PetOwnerPage({ pet }: { pet: Pet }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("editing");

  const { isPending, execute } = useServerAction(deletePetAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Pet deleted!");
    },
  });

  const petAgeString = getPetAgeString(pet.dob);

  return (
    <div className="container mx-auto space-y-6 p-4">
      <div className="flex h-full w-full grow flex-row place-content-center">
        {isEditing ? (
          <Card className="w-full max-w-[1000px]">
            <CardContent className="p-8">
              <div className="flex flex-row flex-wrap place-content-center gap-8">
                <div className="flex max-w-[500px] flex-col place-content-between gap-2">
                  <PetEditForm pet={pet} />
                </div>

                <div className="flex max-w-[800px] grow flex-col gap-2">
                  <div className="text-xl">Notes for Sitters</div>
                  <div className="h-full w-full">
                    <Textarea
                      placeholder={`Include information that will help sitters take care of ${pet.name}, such as allergies, behaviours, or their favourite toy.`}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-[1000px]">
            <CardContent className="p-8">
              <div className="flex flex-row flex-wrap place-content-center gap-8">
                <div className="flex max-w-[500px] flex-col place-content-between gap-2">
                  <div className="flex flex-col gap-2">
                    <Avatar className="h-56 w-56">
                      <AvatarImage
                        src={pet.image}
                        alt={`${pet.name}'s avatar`}
                        className="h-18"
                      />
                      {/* Make this actually be the initials rather than first letter */}
                      <AvatarFallback delayMs={600}>
                        {pet.name.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col">
                      <p className="text-2xl font-semibold">{pet.name}</p>
                      <p className="pt-2 text-lg text-muted-foreground">
                        {pet.species}
                      </p>
                      <p className="text-lg font-light text-muted-foreground">
                        {pet.breed}
                      </p>
                      <p className="text-lg text-muted-foreground">{pet.sex}</p>
                      <p className="text-lg font-light text-muted-foreground">
                        {petAgeString} old
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-row flex-wrap place-content-center gap-3">
                    <Button onClick={() => router.replace("?editing=true")}>
                      <MdEdit className="mr-1 h-4 w-4" />
                      Edit Pet
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <MdDelete className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Pet</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogDescription>
                          <p className="pb-2 font-medium">
                            Are you sure you want to delete this pet?{" "}
                          </p>
                          <p className="font-light">
                            This action cannot be undone and will delete all
                            associated data including tasks for this pet.
                          </p>
                        </AlertDialogDescription>
                        <AlertDialogFooter>
                          <AlertDialogAction
                            onClick={async () => {
                              await execute({ petId: pet.petId });
                            }}
                            disabled={isPending}
                          >
                            Confirm
                          </AlertDialogAction>
                          <AlertDialogCancel disabled={isPending}>
                            Cancel
                          </AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="flex max-w-[800px] grow flex-col gap-2">
                  <div className="text-xl">Notes for Sitters</div>
                  <div className="h-full w-full">
                    <Textarea
                      placeholder={`Include information that will help sitters take care of ${pet.name}, such as allergies, behaviours, or their favourite toy.`}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
