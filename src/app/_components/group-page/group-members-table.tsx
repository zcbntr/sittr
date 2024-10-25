"use client";

import { columns } from "~/components/ui/data-tables/group-members-columns";
import { DataTable } from "~/components/ui/data-table";
import { GroupMember, groupMemberListSchema } from "~/lib/schema";
import React from "react";

export default function GroupMembersTable({ groupId }: { groupId: string }) {
  const [groupMembers, setGroupMembers] = React.useState<GroupMember[]>([]);

  React.useEffect(() => {
    async function fetchGroupMembers(): Promise<void> {
      await fetch("../api/group-members?id=" + groupId, {
        method: "GET",
      })
        .then((res) => res.json())
        .then((json) => groupMemberListSchema.safeParse(json))
        .then((validatedGroupMemberListObject) => {
          if (!validatedGroupMemberListObject.success) {
            console.error(validatedGroupMemberListObject.error.message);
            throw new Error("Failed to fetch group members");
          }

          setGroupMembers(validatedGroupMemberListObject.data);
        });
    }

    void fetchGroupMembers();

    document.addEventListener("memberAdded", () => {
      void fetchGroupMembers();
    });

    document.addEventListener("memberRemoved", () => {
      void fetchGroupMembers();
    });
  }, []);

  return (
    <div className="container mx-auto">
      <DataTable
        columns={columns}
        data={groupMembers}
        searchable={true}
        filterable={true}
      />
    </div>
  );
}
