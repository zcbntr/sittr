import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { GroupMemberPage } from "~/app/_components/group-page/group-member-page";
import { GroupOwnerPage } from "~/app/_components/group-page/group-owner-page";
import { GroupPet } from "~/lib/schemas/groups";
import { getGroupById, getGroupPets, getIsUserGroupOwner } from "~/server/queries/groups";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  // Get the data for the group from the slug
  const params = await props.params;
  const slug = params.slug;

  const group = await getGroupById(slug);

  if (group == null || typeof group === "string") {
    // No such group exists, or an error, return group empty page

    return <GroupDoesNotExistPage />;
  } else {
    // Get group pets
    const groupPets: GroupPet[] = await getGroupPets(group.id);

    // Check if user is the owner of the group
    const userIsOwnerOrError = await getIsUserGroupOwner(group.id);

    if (typeof userIsOwnerOrError === "string") {
      return <GroupDoesNotExistPage />;
    }

    const userIsOwner = userIsOwnerOrError;

    if (userIsOwner) {
      return <GroupOwnerPage group={group} groupPets={groupPets} />;
    } else {
      return <GroupMemberPage group={group} groupPets={groupPets} />;
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
