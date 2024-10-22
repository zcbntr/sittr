import { Suspense } from "react";
import GroupsTable from "../_components/groupstable";

const MyGroupsPage = () => (
  <>
    <section className="container mx-auto py-4">
      <h1 className="text-3xl">My Groups</h1>
    </section>
    <section>
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <GroupsTable />
        </div>
      </Suspense>
    </section>
  </>
);

export default MyGroupsPage;
