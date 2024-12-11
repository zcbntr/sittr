import { Suspense } from "react";
import PetsTable from "../_components/my-pets/petstable";
import type { Pet } from "~/lib/schemas/pets";
import { getOwnedPets } from "~/server/queries/pets";
import { getLoggedInUser } from "~/server/queries/users";
import { redirect } from "next/navigation";

export default async function Page() {
  const user = await getLoggedInUser();

  if (!user) {
    redirect("/");
  }

  const pets = await getOwnedPets();

  return <MyPetsPage pets={pets} />;
}

function MyPetsPage({ pets }: { pets: Pet[] }) {
  return (
    <>
      <section className="container mx-auto py-4">
        <h1 className="text-3xl">My Pets</h1>
      </section>
      <section>
        <Suspense fallback={<div>Loading...</div>}>
          <div className="container mx-auto">
            <PetsTable pets={pets} />
          </div>
        </Suspense>
      </section>
    </>
  );
}
