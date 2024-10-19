import { getOwnedPets } from "~/server/queries";
import { columns } from "~/components/ui/data-tables/pets-columns";
import { DataTable } from "~/components/ui/data-tables/pets-data-table";

export default async function PetsTable() {
  const pets = await getOwnedPets();

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={pets} />
    </div>
  );
}
