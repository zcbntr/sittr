import { Suspense } from "react";
import { getGroupsUserIsIn } from "~/server/queries/groups";
import { type SelectGroup } from "~/lib/schemas/groups";
import GroupsTable from "../_components/my-groups/groupstable";
import { getBasicLoggedInUser } from "~/server/queries/users";
import { redirect } from "next/navigation";
import { type SelectUser } from "~/lib/schemas/users";

export default async function Page() {
  const [user, groups] = await Promise.all([
    getBasicLoggedInUser(),
    getGroupsUserIsIn(),
  ]);

  if (!user) {
    redirect("/");
  }

  return <MyGroupsPage groups={groups} user={user} />;
}

function MyGroupsPage({ groups, user }: { groups: SelectGroup[]; user: SelectUser }) {
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
