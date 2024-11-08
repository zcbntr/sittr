import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { GroupMemberPage } from "~/app/_components/group-page/group-member-page";
import { GroupOwnerPage } from "~/app/_components/group-page/group-owner-page";
import type { GroupMember, GroupPet } from "~/lib/schemas/groups";
import {
  getGroupById,
  getGroupMembers,
  getGroupPets,
  getIsUserGroupOwner,
} from "~/server/queries/groups";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Get the data for the group from the slug
  const slug = (await params).slug;

  const group = await getGroupById(slug);

  if (group == null) {
    // No such group exists

    return <GroupDoesNotExistPage />;
  } else {
    const groupPets: GroupPet[] = await getGroupPets(group.id);
    const groupMembers: GroupMember[] = await getGroupMembers(group.id);

    // Check if user is the owner of the group
    const userIsOwnerOrError = await getIsUserGroupOwner(group.id);

    if (typeof userIsOwnerOrError === "string") {
      return <GroupDoesNotExistPage />;
    }

    const userIsOwner = userIsOwnerOrError;

    if (userIsOwner) {
      return (
        <GroupOwnerPage
          group={group}
          groupPets={groupPets}
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
