"use client";

import { columns } from "~/components/ui/data-tables/groups-columns";
import { DataTable } from "~/components/ui/data-table";
import { Group, groupListSchema } from "~/lib/schema";
import React from "react";

export default function GroupsTable() {
  const [groups, setGroups] = React.useState<Group[]>([]);

  React.useEffect(() => {
    async function fetchGroups(): Promise<void> {
      await fetch("../api/pet?all=true", {
        method: "GET",
      })
        .then((res) => res.json())
        .then((json) => groupListSchema.safeParse(json))
        .then((validatedGroupListObject) => {
          if (!validatedGroupListObject.success) {
            console.error(validatedGroupListObject.error.message);
            throw new Error("Failed to fetch pets");
          }

          setGroups(validatedGroupListObject.data);
        });
    }

    void fetchGroups();

    document.addEventListener("groupCreated", () => {
      void fetchGroups();
    });

    document.addEventListener("groupUpdated", () => {
      void fetchGroups();
    });

    document.addEventListener("groupDeleted", () => {
      void fetchGroups();
    });
  }, []);

  return (
    <div className="container mx-auto">
      <DataTable
        columns={columns}
        data={groups}
        searchable={false}
        filterable={false}
      />
    </div>
  );
}
