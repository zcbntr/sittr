"use client";

import { GroupMember, GroupPet, type Group } from "~/lib/schemas/groups";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import React from "react";
import GroupPetsTable from "./group-pets-table";
import GroupMembersTable from "./group-members-table";

export function GroupMemberPage({
  group,
  groupPets,
  groupMembers,
}: {
  group: Group;
  groupPets: GroupPet[];
  groupMembers: GroupMember[];
}) {
  return (
    <div className="container mx-auto space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <h3 className="text-lg font-semibold">{group?.name}</h3>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{group?.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Group Members</CardTitle>
          <CardDescription>
            View the members of your pet sitting group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GroupMembersTable groupId={group.id} groupMembers={groupMembers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pets</CardTitle>
          <CardDescription>
            View the pets your group takes care of
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GroupPetsTable
            groupId={group.id}
            groupPets={groupPets}
            isOwner={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
