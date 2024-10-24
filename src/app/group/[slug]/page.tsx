import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getGroupById, getPetsOfGroup } from "~/server/queries";
import { GroupMemberPage } from "~/app/_components/group-page/group-member-page";
import { GroupOwnerPage } from "~/app/_components/group-page/group-owner-page";
import { auth } from "@clerk/nextjs/server";

export default async function Page({ params }: { params: { slug: string } }) {
  // Get the data for the group from the slug
  const group = await getGroupById(params.slug);

  if (group == null) {
    // No such group exists, return group empty page

    return <GroupDoesNotExistPage />;
  } else {
    // Fetch pets of the group
    const petsOfGroup = await getPetsOfGroup(group.id);

    // Check if user is the owner of the group
    const { userId } = await auth();
    const owner = group.members?.find((x) => x.role === "Owner");
    if (owner?.userId == userId) {
      return <GroupOwnerPage group={group} petsOfGroup={petsOfGroup} />;
    } else {
      return <GroupMemberPage group={group} petsOfGroup={petsOfGroup} />;
    }
  }
}

export function GroupDoesNotExistPage() {
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
