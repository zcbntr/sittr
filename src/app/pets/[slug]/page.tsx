import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { PetOwnerPage } from "~/app/_components/pet-page/pet-owner-page";
import { PetNonOwnerPage } from "~/app/_components/pet-page/pet-non-owner-page";
import { getBasicLoggedInUser } from "~/server/queries/users";
import {
  getOwnedPetById,
  getPetVisibleViaCommonGroup,
} from "~/server/queries/pets";
import { type SelectPet } from "~/lib/schemas/pets";
import { markNotificationAsReadAction } from "~/server/actions/notification-actions";
import { redirect } from "next/navigation";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Get the data for the pet from the slug
  const slug = (await params).slug;
  let pet: SelectPet | null = await getOwnedPetById(slug);
  if (!pet) {
    pet = await getPetVisibleViaCommonGroup(slug);
    if (!pet) {
      pet = null;
    }
  }

  if (pet == null) {
    // No such pet exists, return pet does not exist page

    return <PetDoesNotExistPage />;
  } else {
    // Check if user is the owner of the pet
    const user = await getBasicLoggedInUser();
    const userId = user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const notification = (await searchParams).notification;

    if (notification) {
      if (
        Array.isArray(notification) &&
        notification.every((item) => typeof item === "string")
      ) {
        // Mark each notification as read
        for (const n of notification) {
          await markNotificationAsReadAction(n);
        }
      } else if (typeof notification === "string") {
        await markNotificationAsReadAction(notification);
      }

      // Redirect to the same page without the notification query
      redirect(`/pets/${slug}`);
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
    <div className="container mx-auto space-y-6 p-4">
      <div className="flex h-full w-full grow flex-row place-content-center">
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
      </div>
    </div>
  );
}
