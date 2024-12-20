"use client";

import { type GroupMember, type Group } from "~/lib/schemas/groups";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import React from "react";
import GroupPetsTable from "./group-pets-table";
import GroupMembersTable from "./group-members-table";
import { type Pet } from "~/lib/schemas/pets";
import { type User } from "~/lib/schemas/users";

export function GroupMemberPage({
  user,
  group,
  groupPets,
  groupMembers,
}: {
  user: User;
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
                user={user}
                groupId={group.id}
                groupMembers={groupMembers}
              />
            </div>

            <div className="flex flex-col">
              <div className="text-lg">Pets</div>
              <GroupPetsTable
                user={user}
                groupId={group.id}
                groupPets={groupPets}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
