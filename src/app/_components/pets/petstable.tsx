import { columns } from "~/components/ui/data-tables/my-pets-columns";
import { DataTable } from "~/components/ui/data-table";
import { type Pet } from "~/lib/schemas/pets";
import CreatePetDialog from "./createpetdialog";
import { Button } from "~/components/ui/button";

export default function PetsTable({ pets }: { pets: Pet[] }) {
  return (
    <div className="">
      <DataTable
        columns={columns}
        data={pets}
        searchable={true}
        filterable={true}
      >
        <CreatePetDialog>
          <Button>New Pet</Button>
        </CreatePetDialog>
      </DataTable>
    </div>
  );
}
