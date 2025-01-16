import { Suspense } from "react";
import PetsTable from "../_components/my-pets/petstable";
import { getOwnedPets } from "~/server/queries/pets";
import { getBasicLoggedInUser } from "~/server/queries/users";
import { redirect } from "next/navigation";

export default async function Page() {
  const user = await getBasicLoggedInUser();

  if (!user) {
    redirect("sign-in?redirect=/my-pets");
  }

  const pets = await getOwnedPets();

  return (
    <>
      <section className="container mx-auto py-4">
        <h1 className="text-3xl">My Pets</h1>
      </section>
      <section>
        <Suspense fallback={<div>Loading...</div>}>
          <div className="container mx-auto">
            <PetsTable user={user} pets={pets} />
          </div>
        </Suspense>
      </section>
    </>
  );
}
