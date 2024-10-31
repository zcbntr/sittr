import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getPetById } from "~/server/queries";
import { auth } from "@clerk/nextjs/server";
import { PetOwnerPage } from "~/app/_components/pet-page/pet-owner-page";

export default async function Page({ params }: { params: { slug: string } }) {
  // Get the data for the group from the slug
  const { slug } = await params;
  const pet = await getPetById(slug);

  if (pet == null) {
    // No such group exists, return group empty page

    return <PetDoesNotExistPage />;
  } else {
    // Check if user is the owner of the pet
    const { userId } = await auth();
    if (pet.ownerId == userId) {
      return <PetOwnerPage pet={pet} />;
    } else {
      return <PetNonOwnerPage pet={pet} />;
    }
  }
}

export function PetDoesNotExistPage() {
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
