import { columns as ownerColumns } from "~/components/ui/data-tables/group-pets-columns";
import { columns as memberColumns } from "~/components/ui/data-tables/group-pets-columns-noedit";
import { DataTable } from "~/components/ui/data-table";
import { type GroupPet } from "~/lib/schemas/groups";
import React from "react";
import { Button } from "~/components/ui/button";
import AddPetToGroupDialog from "./add-pet-to-group-dialog";

export default function GroupPetsTable({
  groupId,
  groupPets,
  isOwner,
}: {
  groupId: string;
  groupPets: GroupPet[];
  isOwner: boolean;
}) {
  return isOwner ? (
    <div className="container mx-auto">
      <DataTable
        columns={ownerColumns}
        data={groupPets}
        searchable={true}
        filterable={true}
      >
        <AddPetToGroupDialog groupId={groupId}>
          <Button>Add Pet</Button>
        </AddPetToGroupDialog>
      </DataTable>
    </div>
  ) : (
    <div className="container mx-auto">
      <DataTable
        columns={memberColumns}
        data={groupPets}
        searchable={true}
        filterable={true}
      />
    </div>
  );
}
