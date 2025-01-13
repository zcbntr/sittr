"use client";

import { Button } from "~/components/ui/button";
import { PetEditForm } from "~/app/_components/pet-page/pet-edit-form";
import { SelectPet, type SelectBasicPet } from "~/lib/schemas/pets";
import { Card, CardContent } from "~/components/ui/card";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MdDelete, MdEdit, MdPets } from "react-icons/md";
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
import { getPetAgeString, initials } from "~/lib/utils";

export function PetOwnerPage({ pet }: { pet: SelectPet }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("editing");
  const petAgeString = pet.dob ? getPetAgeString(pet.dob) : null;

  const { isPending, execute: executeDelete } = useServerAction(deletePetAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Pet deleted!");
    },
  });

  return (
    <div className="container mx-auto space-y-6 p-4">
      <div className="flex h-full w-full grow flex-row place-content-center">
        {isEditing ? (
          <PetEditForm pet={pet} />
        ) : (
          <Card className="w-full max-w-[1000px]">
            <CardContent className="p-8">
              <div className="flex flex-row flex-wrap place-content-center gap-8">
                <div className="flex max-w-[500px] flex-col place-content-between gap-2">
                  <div className="flex flex-col gap-2">
                    <Avatar className="h-56 w-56">
                      <AvatarImage
                        src={pet.profilePic ? pet.profilePic.url : undefined}
                        alt={`${pet.name}'s avatar`}
                        className="h-18"
                      />

                      <AvatarFallback delayMs={600}>
                        {pet.name ? initials(pet.name) : <MdPets />}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-0.5">
                      <p className="text-2xl font-semibold">{pet.name}</p>
                      <p className="pt-2 text-xl text-muted-foreground">
                        {pet.species}{" "}
                        {pet.breed && (
                          <span className="align-bottom text-lg text-muted-foreground">
                            ({pet.breed})
                          </span>
                        )}
                      </p>

                      {petAgeString && (
                        <p className="text-xl text-muted-foreground">
                          {petAgeString} old
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-row flex-wrap place-content-center gap-3">
                    <Button
                      className="w-full sm:w-min"
                      onClick={() => router.replace("?editing=true")}
                    >
                      <MdEdit className="mr-1 h-4 w-4" />
                      Edit Pet
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className="w-full sm:w-min"
                          variant="destructive"
                        >
                          <MdDelete className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Pet</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogDescription className="font-medium">
                          Are you sure you want to delete this pet? This action
                          cannot be undone and will delete all associated data
                          including tasks for this pet.
                        </AlertDialogDescription>
                        <AlertDialogFooter>
                          <AlertDialogAction
                            onClick={async () => {
                              await executeDelete({ petId: pet.id });
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
                  <div className="w-240 flex max-h-full min-h-[250px] min-w-[270px] rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:h-[620px] sm:w-full md:text-sm">
                    {pet.note ?? `No notes written for ${pet.name}`}
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
