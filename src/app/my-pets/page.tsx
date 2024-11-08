import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import PetsTable from "../_components/pets/petstable";
import type { Pet } from "~/lib/schemas/pets";
import { getOwnedPets } from "~/server/queries/pets";

export default async function Page() {
  const pets = await getOwnedPets();

  return <MyPetsPage pets={pets} />;
}

function MyPetsPage({ pets }: { pets: Pet[] }) {
  return (
    <div className="container mx-auto space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Pets</CardTitle>
          <CardDescription>View and manage your pets.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="container mx-auto">
            <PetsTable pets={pets} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
