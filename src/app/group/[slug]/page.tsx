import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getGroupById, getIsUserGroupOwner } from "~/server/queries";
import { GroupMemberPage } from "~/app/_components/group-page/group-member-page";
import { GroupOwnerPage } from "~/app/_components/group-page/group-owner-page";

export default async function Page(props: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Get the data for the group from the slug
  const { slug } = await props.params;
  const group = await getGroupById(slug);

  if (group == null) {
    // No such group exists, return group empty page

    return <GroupDoesNotExistPage />;
  } else {
    // Check if user is the owner of the group
    const userIsOwner = await getIsUserGroupOwner(group.id);
    if (userIsOwner) {
      return <GroupOwnerPage group={group} />;
    } else {
      return <GroupMemberPage group={group} />;
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
