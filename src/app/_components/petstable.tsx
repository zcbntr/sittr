"use client";

import { getOwnedPets } from "~/server/queries";
import { columns } from "~/components/ui/data-tables/pets-columns";
import { DataTable } from "~/components/ui/data-table";
import EditPetDialog from "./editpetdialog";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { Pet, petListSchema } from "~/lib/schema";
import React from "react";

export default async function PetsTable() {
  const [pets, setPets] = React.useState<Pet[]>([]);

  React.useEffect(() => {
    async function fetchPreferences(): Promise<void> {
      await fetch("../api/pet?all=true", {
        method: "GET",
      })
        .then((res) => res.json())
        .then((json) => petListSchema.safeParse(json))
        .then((validatedPetListObject) => {
          if (!validatedPetListObject.success) {
            console.error(validatedPetListObject.error.message);
            throw new Error("Failed to fetch pets");
          }

          setPets(validatedPetListObject.data);
        });
    }

    void fetchPreferences();
  }, []);

  return (
    <div className="container mx-auto">
      <DataTable columns={columns} data={pets} />
      <EditPetHiddenButton />
    </div>
  );
}

function EditPetHiddenButton() {
  const [editPetDialogProps, setPetDialogProps] = useState<Pet>();

  return (
    <EditPetDialog props={editPetDialogProps}>
      <Button id="openEditPetDialogHiddenButton" className="hidden"></Button>
    </EditPetDialog>
  );
}
