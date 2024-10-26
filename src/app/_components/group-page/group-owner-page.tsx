"use client";

import { useState } from "react";
import { GroupNameDescriptionForm } from "~/app/_components/group-page/name-description-form";
import { type Group, groupSchema } from "~/lib/schema";
import { MdEdit } from "react-icons/md";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import React from "react";
import GroupPetsTable from "./group-pets-table";
import GroupMembersTable from "./group-members-table";

export function GroupOwnerPage({ group }: { group: Group }) {
  const [isEditing, setIsEditing] = useState(false);

  React.useEffect(() => {
    async function fetchGroup() {
      await fetch("../api/groups?id=" + group.id, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((json) => groupSchema.safeParse(json))
        .then((validatedGroupObject) => {
          if (!validatedGroupObject.success) {
            console.error(validatedGroupObject.error.message);
            throw new Error("Failed to get group");
          }

          group = validatedGroupObject.data;
        });
    }

    document.addEventListener("groupUpdated", () => {
      setIsEditing(false);
      // Invalidate the group data and refetch
      void fetchGroup();
    });

    document.addEventListener("cancelEdit", () => {
      setIsEditing(false);
    });
  }, []);

  return (
    <div className="container mx-auto space-y-6 p-4">
      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h3 className="text-lg font-semibold">Edit Group Info</h3>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <GroupNameDescriptionForm group={group} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              <h3 className="text-lg font-semibold">{group?.name}</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{group?.description}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setIsEditing(true)}>
              <MdEdit className="mr-2 h-4 w-4" />
              Edit Group Info
            </Button>
          </CardFooter>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Group Members</CardTitle>
          <CardDescription>
            Manage the members of your pet sitting group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GroupMembersTable groupId={group.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pets</CardTitle>
          <CardDescription>
            Manage the pets your group takes care of
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GroupPetsTable groupId={group.id} />
        </CardContent>
      </Card>
    </div>
  );
}
