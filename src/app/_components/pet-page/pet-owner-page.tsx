"use client";

import { Button } from "~/components/ui/button";
import { PetEditForm } from "~/app/_components/pet-page/pet-edit-form";
import { type Pet } from "~/lib/schemas/pets";
import { Pencil } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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

  return (
    <div className="container mx-auto space-y-6 p-4">
      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="text-lg font-semibold">Edit Pet Info</div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PetEditForm pet={pet} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="text-lg font-semibold">{pet.name}</div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground">{pet.species}</p>
              <p className="text-muted-foreground">{pet.breed}</p>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex grow flex-row place-content-between">
              <Button onClick={() => router.replace("?editing=true")}>
                <MdEdit className="mr-1 h-4 w-4" />
                Edit Pet Info
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <MdDelete className="mr-1 h-4 w-4" />
                    Delete Pet
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Pet</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogDescription>
                    Are you sure you want to delete this pet? This action cannot
                    be undone.
                  </AlertDialogDescription>
                  <AlertDialogFooter>
                    <AlertDialogAction
                      onClick={async () => {
                        execute({ petId: pet.petId });
                      }}
                    >
                      Confirm
                    </AlertDialogAction>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
