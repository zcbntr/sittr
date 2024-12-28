import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { GroupMemberPage } from "~/app/_components/group-page/group-member-page";
import { GroupOwnerPage } from "~/app/_components/group-page/group-owner-page";
import type { SelectBasicGroupMember } from "~/lib/schemas/groups";
import {
  getGroupById,
  getGroupMembers,
  getGroupPets,
  getIsUserGroupOwner,
  getUsersPetsNotInGroup,
} from "~/server/queries/groups";
import { type SelectBasicPet } from "~/lib/schemas/pets";
import { redirect } from "next/navigation";
import { getLoggedInUser } from "~/server/queries/users";
import { markNotificationAsReadAction } from "~/server/actions/notification-actions";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getLoggedInUser();
  if (!user) {
    redirect("/");
  }

  // Get the data for the group from the slug
  const slug = (await params).slug;

  const group = await getGroupById(slug);

  if (group == null) {
    // No such group exists

    return <GroupDoesNotExistPage />;
  } else {
    const groupPets: SelectBasicPet[] = await getGroupPets(group.id);
    const groupMembers: SelectBasicGroupMember[] = await getGroupMembers(
      group.id,
    );

    // Check if user is the owner of the group
    const userIsOwnerOrError = await getIsUserGroupOwner(group.id);

    if (typeof userIsOwnerOrError === "string") {
      return <GroupDoesNotExistPage />;
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
      redirect(`/groups/${slug}`);
    }

    const userIsOwner = userIsOwnerOrError;

    if (userIsOwner) {
      const petsNotInGroup: SelectBasicPet[] = await getUsersPetsNotInGroup(
        group.id,
      );

      return (
        <GroupOwnerPage
          user={user}
          group={group}
          groupPets={groupPets}
          petsNotInGroup={petsNotInGroup}
          groupMembers={groupMembers}
        />
      );
    } else {
      return (
        <GroupMemberPage
          user={user}
          group={group}
          groupPets={groupPets}
          groupMembers={groupMembers}
        />
      );
    }
  }
}

function GroupDoesNotExistPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3 className="text-lg font-semibold">Group Not Found</h3>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          The group you are looking for does not exist.
        </p>
      </CardContent>
    </Card>
  );
}
