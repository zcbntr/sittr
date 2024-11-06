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

export function PetOwnerPage({ pet }: { pet: Pet }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("editing");

  return (
    <div className="container mx-auto space-y-6 p-4">
      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h3 className="text-lg font-semibold">Edit Pet Info</h3>
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
              <h3 className="text-lg font-semibold">{pet?.name}</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground">{pet.species}</p>
              <p className="text-muted-foreground">{pet.breed}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.replace("?editing=true")}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Pet Info
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
