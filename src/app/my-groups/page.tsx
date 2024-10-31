import { Suspense } from "react";
import GroupsTable from "../_components/groupstable";
import CreateGroupDialog from "../_components/creategroupdialog";
import { Button } from "~/components/ui/button";
import JoinGroupDialog from "../_components/join-group-dialog";

const MyGroupsPage = () => (
  <>
    <section className="container mx-auto py-4">
      <h1 className="text-3xl">My Groups</h1>
      <div className="flex flex-row gap-4 py-4">
        <CreateGroupDialog>
          <Button variant="outline">New Group</Button>
        </CreateGroupDialog>
        <JoinGroupDialog>
          <Button variant="outline">Join Group</Button>
        </JoinGroupDialog>
      </div>
    </section>
    <section>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="container mx-auto">
          <GroupsTable />
        </div>
      </Suspense>
    </section>
  </>
);

export default MyGroupsPage;
