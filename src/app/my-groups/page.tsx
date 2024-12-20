import { Suspense } from "react";
import { getGroupsUserIsIn } from "~/server/queries/groups";
import { type Group } from "~/lib/schemas/groups";
import GroupsTable from "../_components/my-groups/groupstable";
import { getLoggedInUser } from "~/server/queries/users";
import { redirect } from "next/navigation";
import { type User } from "~/lib/schemas/users";

export default async function Page() {
  const [user, groups] = await Promise.all([
    getLoggedInUser(),
    getGroupsUserIsIn(),
  ]);

  if (!user) {
    redirect("/");
  }

  return <MyGroupsPage groups={groups} user={user} />;
}

function MyGroupsPage({ groups, user }: { groups: Group[]; user: User }) {
  return (
    <>
      <section className="container mx-auto py-4">
        <h1 className="text-3xl">My Groups</h1>
      </section>
      <section>
        <Suspense fallback={<div>Loading...</div>}>
          <div className="container mx-auto">
            <GroupsTable groups={groups} user={user} />
          </div>
        </Suspense>
      </section>
    </>
  );
}
