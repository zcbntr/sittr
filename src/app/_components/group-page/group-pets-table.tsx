"use client";

import { columns } from "~/components/ui/data-tables/group-pets-columns";
import { DataTable } from "~/components/ui/data-table";
import { Pet, petListSchema } from "~/lib/schema";
import React from "react";

export default function GroupPetsTable({ groupId }: { groupId: string }) {
  const [groupPets, setGroupPets] = React.useState<Pet[]>([]);

  React.useEffect(() => {
    async function fetchGroupPets(): Promise<void> {
      await fetch("../api/group-pets?id=" + groupId, {
        method: "GET",
      })
        .then((res) => res.json())
        .then((json) => petListSchema.safeParse(json))
        .then((validatedGroupPetListObject) => {
          if (!validatedGroupPetListObject.success) {
            console.error(validatedGroupPetListObject.error.message);
            throw new Error("Failed to fetch group pets");
          }

          setGroupPets(validatedGroupPetListObject.data);
        });
    }

    void fetchGroupPets();

    document.addEventListener("petAdded", () => {
      void fetchGroupPets();
    });

    document.addEventListener("petRemoved", () => {
      void fetchGroupPets();
    });
  }, []);

  return (
    <div className="container mx-auto">
      <DataTable
        columns={columns}
        data={groupPets}
        searchable={true}
        filterable={true}
      />
    </div>
  );
}
