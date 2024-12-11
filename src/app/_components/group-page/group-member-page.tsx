"use client";

import {
  type GroupMember,
  type Group,
} from "~/lib/schemas/groups";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import React from "react";
import GroupPetsTable from "./group-pets-table";
import GroupMembersTable from "./group-members-table";
import { type Pet } from "~/lib/schemas/pets";

export function GroupMemberPage({
  group,
  groupPets,
  groupMembers,
}: {
  group: Group;
  groupPets: Pet[];
  groupMembers: GroupMember[];
}) {
  return (
    <div className="container mx-auto space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="text-lg font-semibold">{group?.name}</div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <p className="text-muted-foreground">{group?.description}</p>
            </div>

            <hr className="my-2 h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>

            <div className="flex flex-col">
              <div className="text-lg">Members</div>
              <GroupMembersTable
                groupId={group.groupId}
                groupMembers={groupMembers}
              />
            </div>

            <div className="flex flex-col">
              <div className="text-lg">Pets</div>
              <GroupPetsTable groupId={group.groupId} groupPets={groupPets} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
