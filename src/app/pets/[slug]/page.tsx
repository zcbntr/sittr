import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { PetOwnerPage } from "~/app/_components/pet-page/pet-owner-page";
import { PetNonOwnerPage } from "~/app/_components/pet-page/pet-non-owner-page";
import { getPetById } from "~/server/queries/pets";
import { getLoggedInUser } from "~/server/queries/users";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Get the data for the pet from the slug
  const slug = (await params).slug;
  const pet = await getPetById(slug);

  if (pet == null) {
    // No such pet exists, return pet does not exist page

    return <PetDoesNotExistPage />;
  } else {
    // Check if user is the owner of the pet
    const user = await getLoggedInUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    if (pet.ownerId == userId) {
      return <PetOwnerPage pet={pet} />;
    } else {
      return <PetNonOwnerPage pet={pet} />;
    }
  }
}

function PetDoesNotExistPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3 className="text-lg font-semibold">Pet Not Found</h3>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          The pet you are looking for does not exist.
        </p>
      </CardContent>
    </Card>
  );
}
