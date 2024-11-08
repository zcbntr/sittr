"use client";

import { columns } from "~/components/ui/data-tables/group-members-columns";
import { DataTable } from "~/components/ui/data-table";
import React from "react";
import CreateGroupInviteDialog from "./create-group-invite-dialog";
import { Button } from "~/components/ui/button";
import { GroupMember } from "~/lib/schemas/groups";

export default function GroupMembersTable({
  groupId,
  groupMembers,
}: {
  groupId: string;
  groupMembers: GroupMember[];
}) {
  return (
    <div className="container mx-auto">
      <DataTable
        columns={columns}
        data={groupMembers}
        searchable={true}
        filterable={true}
      >
        <CreateGroupInviteDialog groupId={groupId}>
          <Button>Create Invite</Button>
        </CreateGroupInviteDialog>
      </DataTable>
    </div>
  );
}
