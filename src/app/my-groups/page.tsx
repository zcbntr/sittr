import { Suspense } from "react";
import { getGroupsUserIsIn } from "~/server/queries/groups";
import { type Group } from "~/lib/schemas/groups";
import GroupsTable from "../_components/my-groups/groupstable";
import { getCurrentLoggedInUser } from "~/server/queries/users";

export default async function Page() {
  const [user, groups] = await Promise.all([
    getCurrentLoggedInUser(),
    getGroupsUserIsIn(),
  ]);

  if (!user) {
    throw new Error("User not found");
  }

  return <MyGroupsPage groups={groups} userId={user.id} />;
}

function MyGroupsPage({ groups, userId }: { groups: Group[]; userId: string }) {
  return (
    <>
      <section className="container mx-auto py-4">
        <h1 className="text-3xl">My Groups</h1>
      </section>
      <section>
        <Suspense fallback={<div>Loading...</div>}>
          <div className="container mx-auto">
            <GroupsTable groups={groups} userId={userId} />
          </div>
        </Suspense>
      </section>
    </>
  );
}
