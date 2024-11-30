import { Suspense } from "react";
import { getGroupsUserIsIn } from "~/server/queries/groups";
import { type Group } from "~/lib/schemas/groups";
import GroupsTable from "../_components/my-groups/groupstable";

export default async function Page() {
  const groups = await getGroupsUserIsIn();

  return <MyGroupsPage groups={groups} />;
}

function MyGroupsPage({ groups }: { groups: Group[] }) {
  return (
    <>
      <section className="container mx-auto py-4">
        <h1 className="text-3xl">My Groups</h1>
      </section>
      <section>
        <Suspense fallback={<div>Loading...</div>}>
          <div className="container mx-auto">
            <GroupsTable groups={groups} />
          </div>
        </Suspense>
      </section>
    </>
  );
}
