"use client";

import { columns } from "~/components/ui/data-tables/my-pets-columns";
import { DataTable } from "~/components/ui/data-table";
import { type Pet, petListSchema } from "~/lib/schemas/pets";
import React from "react";

export default function PetsTable() {
  const [pets, setPets] = React.useState<Pet[]>([]);

  React.useEffect(() => {
    async function fetchPets(): Promise<void> {
      await fetch("../api/pets?all=true", {
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

    void fetchPets();

    document.addEventListener("petCreated", () => {
      void fetchPets();
    });

    document.addEventListener("petUpdated", () => {
      void fetchPets();
    });

    document.addEventListener("petDeleted", () => {
      void fetchPets();
    });
  }, []);

  return (
    <div className="container mx-auto">
      <DataTable
        columns={columns}
        data={pets}
        searchable={true}
        filterable={true}
      />
    </div>
  );
}
