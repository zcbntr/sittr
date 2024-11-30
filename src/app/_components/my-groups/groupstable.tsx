import { columns } from "~/components/ui/data-tables/my-groups-columns";
import { DataTable } from "~/components/ui/data-table";
import CreateGroupDialog from "./creategroupdialog";
import { Button } from "~/components/ui/button";
import { type Group } from "~/lib/schemas/groups";
import JoinGroupDialog from "./join-group-dialog";

export default function GroupsTable({ groups }: { groups: Group[] }) {
  return (
    <div className="">
      <DataTable
        columns={columns}
        data={groups}
        searchable={true}
        filterable={false}
      >
        <CreateGroupDialog>
          <Button>New Group</Button>
        </CreateGroupDialog>

        <JoinGroupDialog>
          <Button variant="outline">Join Group</Button>
        </JoinGroupDialog>
      </DataTable>
    </div>
  );
}
