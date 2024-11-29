"use client";

import { columns } from "~/components/ui/data-tables/group-members-columns";
import { DataTable } from "~/components/ui/data-table";
import React from "react";
import CreateGroupInviteDialog from "./create-group-invite-dialog";
import { Button } from "~/components/ui/button";
import { type GroupMember } from "~/lib/schemas/groups";

export default function GroupMembersTable({
  groupId,
  groupMembers,
  isOwner,
}: {
  groupId: string;
  groupMembers: GroupMember[];
  isOwner?: boolean;
}) {
  return isOwner ? (
    <DataTable
      columns={columns}
      data={groupMembers}
      searchable={true}
      filterable={false}
    >
      <CreateGroupInviteDialog groupId={groupId}>
        <Button>Create Invite</Button>
      </CreateGroupInviteDialog>
    </DataTable>
  ) : (
    <DataTable
      columns={columns}
      data={groupMembers}
      searchable={true}
      filterable={false}
    />
  );
}
