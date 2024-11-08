import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import GroupRedirectButton from "~/components/group-redirect-button";
import { type Group } from "~/lib/schemas/groups";
import { getGroupsUserIsIn } from "~/server/queries/groups";

export default async function GroupsTable() {
  const groupsOrError = await getGroupsUserIsIn();

  if (typeof groupsOrError === "string") {
    return <div>{groupsOrError}</div>;
  }

  const groups: Group[] = groupsOrError;

  return (
    <>
      <Table>
        {/* Show the owner of the group? Maybe a group info zod schema for owner, members, pets as well as basic group info */}
        <TableHeader>
          <TableRow>
            <TableHead className="max-w-36">Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Pets</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <TableRow key={group.id}>
              <TableCell>
                <GroupRedirectButton groupId={group.id}>
                  <div className="font-semibold">{group.name}</div>
                </GroupRedirectButton>
              </TableCell>
              <TableCell>
                {group.description
                  ? group.description.length <= 27
                    ? group.description
                    : group.description.substring(0, 27) + "..."
                  : ""}
              </TableCell>
              <TableCell>
                {group.members ? group.members.length : "No members"}
              </TableCell>
              <TableCell>
                {group.pets ? group.pets.length : "No pets"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {groups.length === 0 && (
        <div className="flex grow flex-row place-content-center py-4 text-xl">
          No groups found. Create or join a group to get started.
        </div>
      )}
    </>
  );
}
