"use client";

import { Button } from "~/components/ui/button";
import { PetEditForm } from "~/app/_components/pet-page/pet-edit-form";
import { type SelectPet } from "~/lib/schemas/pets";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MdDelete, MdEdit, MdPerson, MdPets } from "react-icons/md";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

import { useServerAction } from "zsa-react";
import { deletePetAction } from "~/server/actions/pet-actions";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { getPetAgeString, initials } from "~/lib/utils";
import { type SelectBasicUser } from "~/lib/schemas/users";
import UsersVisibleTo from "./users-visible-to";

export function PetOwnerPage({
  pet,
  usersVisibleTo,
}: {
  pet: SelectPet;
  usersVisibleTo: SelectBasicUser[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("editing");
  const petAgeString = pet.dob ? getPetAgeString(pet.dob) : null;

  const [visibleToModal, setVisibleToModal] = React.useState(false);

  const { isPending, execute: executeDelete } = useServerAction(
    deletePetAction,
    {
      onError: ({ err }) => {
        toast.error(err.message);
      },
      onSuccess: () => {
        toast.success("Pet deleted!");
      },
    },
  );

  return (
    <div className="container mx-auto w-full space-y-6 p-4">
      <div className="flex h-full w-full grow flex-row place-content-center">
        {isEditing ? (
          <PetEditForm pet={pet} />
        ) : (
          <div className="flex h-full w-full max-w-3xl flex-col gap-4">
            <div className="flex flex-row place-content-center text-sm text-muted-foreground">
              People in groups that sit for {pet.name} will see this page.{" "}
              <Dialog open={visibleToModal} onOpenChange={setVisibleToModal}>
                {usersVisibleTo.length > 0 && (
                  <DialogTrigger className="underline">See who</DialogTrigger>
                )}
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Users who can see {pet.name}</DialogTitle>
                    <DialogDescription>
                      These users are in a group that sits for {pet.name}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="pt-5">
                    <UsersVisibleTo pet={pet} users={usersVisibleTo} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex w-full max-w-3xl flex-row flex-wrap place-content-center gap-8 p-2 md:flex-nowrap">
              <div className="flex flex-col place-content-between sm:max-w-64">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-row place-content-center">
                    <Avatar className="h-full w-full max-w-64 max-h-64">
                      <AvatarImage
                        src={pet.profilePic ? pet.profilePic.url : undefined}
                        alt={`${pet.name}'s avatar`}
                      />

                      <AvatarFallback delayMs={600}>
                        {pet.name ? initials(pet.name) : <MdPets />}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex flex-col gap-1">
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

                    <div className="flex flex-row gap-2 pt-2">
                      <div className="flex flex-col place-content-center">
                        <div className="relative inline-block">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={
                                pet.owner?.image ? pet.owner.image : undefined
                              }
                              alt={`${pet.owner?.name}'s avatar`}
                              className="h-18"
                            />

                            <AvatarFallback delayMs={600}>
                              {pet.owner?.name ? (
                                initials(pet.owner.name)
                              ) : (
                                <MdPerson />
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {pet.owner?.plusMembership && (
                            <div className="absolute right-0 top-0 -mr-1 -mt-1 flex h-5 w-5 items-center justify-center text-2xl font-bold text-violet-600">
                              +
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col place-content-center text-muted-foreground">
                        <div className="flex flex-col">
                          <div className="text-md">Owned By</div>{" "}
                          <div className="text-xl">{pet.owner?.name}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-row flex-wrap place-content-center gap-3 sm:mt-6">
                  <Button
                    className="w-full min-w-24"
                    onClick={() => router.replace("?editing=true")}
                  >
                    <MdEdit className="w-4" />
                    Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full min-w-24" variant="destructive">
                        <MdDelete className="w-4" />
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

              <div className="flex h-full w-full max-w-2xl grow flex-col gap-2">
                <div className="text-xl">Notes for Sitters</div>
                <div className="flex max-h-full min-h-96 min-w-64 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:h-[620px] sm:w-full md:text-sm">
                  {pet.note ?? `No notes written for ${pet.name}`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
