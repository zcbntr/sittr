import { columns } from "~/components/ui/data-tables/group-pets-columns";
import { DataTable } from "~/components/ui/data-table";
import { type GroupPet } from "~/lib/schemas/groups";
import React from "react";
import { Button } from "~/components/ui/button";
import AddPetToGroupDialog from "./add-pet-to-group-dialog";

export default function GroupPetsTable({
  groupId,
  groupPets,
}: {
  groupId: string;
  groupPets: GroupPet[];
}) {
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
        </AddPetToGroupDialog>
      </DataTable>
    </div>
  );
}
