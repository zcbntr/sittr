"use client";

import { columns } from "~/components/ui/data-tables/group-pets-columns";
import { DataTable } from "~/components/ui/data-table";
import { type GroupPet, groupPetListSchema } from "~/lib/schemas/groups";
import React from "react";
import { Button } from "~/components/ui/button";
import AddPetToGroupDialog from "./add-pet-to-group-dialog";

export default function GroupPetsTable({ groupId }: { groupId: string }) {
  const [groupPets, setGroupPets] = React.useState<GroupPet[]>([]);

  React.useEffect(() => {
    async function fetchGroupPets(): Promise<void> {
      await fetch("../api/group-pets?id=" + groupId, {
        method: "GET",
      })
        .then((res) => res.json())
        .then((json) => groupPetListSchema.safeParse(json))
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

    document.addEventListener("petsUpdated", () => {
      void fetchGroupPets();
    });
  }, [groupId]);

  return (
    <div className="container mx-auto">
      <DataTable
        columns={columns}
        data={groupPets}
        searchable={true}
        filterable={true}
      >
        <AddPetToGroupDialog groupId={groupId}>
          <Button>Add Pet</Button>
        </AddPetToGroupDialog>{" "}
      </DataTable>
    </div>
  );
}
