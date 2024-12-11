import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { GroupMemberPage } from "~/app/_components/group-page/group-member-page";
import { GroupOwnerPage } from "~/app/_components/group-page/group-owner-page";
import type { GroupMember } from "~/lib/schemas/groups";
import {
  getGroupById,
  getGroupMembers,
  getGroupPets,
  getIsUserGroupOwner,
  getUsersPetsNotInGroup,
} from "~/server/queries/groups";
import { type Pet } from "~/lib/schemas/pets";
import { redirect } from "next/navigation";
import { getLoggedInUser } from "~/server/queries/users";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
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
    const groupPets: Pet[] = await getGroupPets(group.groupId);
    const groupMembers: GroupMember[] = await getGroupMembers(group.groupId);

    // Check if user is the owner of the group
    const userIsOwnerOrError = await getIsUserGroupOwner(group.groupId);

    if (typeof userIsOwnerOrError === "string") {
      return <GroupDoesNotExistPage />;
    }

    const userIsOwner = userIsOwnerOrError;

    if (userIsOwner) {
      const petsNotInGroup: Pet[] = await getUsersPetsNotInGroup(group.groupId);

      return (
        <GroupOwnerPage
          group={group}
          groupPets={groupPets}
          petsNotInGroup={petsNotInGroup}
          groupMembers={groupMembers}
        />
      );
    } else {
      return (
        <GroupMemberPage
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
