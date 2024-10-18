import { Suspense } from "react";
import GroupList from "~/app/_components/grouplist";

const MyGroupsPage = () => (
  <section>
    <Suspense fallback={<div>Loading...</div>}>
      <div>
        <GroupList />
      </div>
    </Suspense>
  </section>
);

export default MyGroupsPage;
