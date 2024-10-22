import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { getGroupsUserIsIn } from "~/server/queries";
import GroupRedirectButton from "~/components/group-redirect-button";

export default async function GroupsTable() {
  const groups = await getGroupsUserIsIn();

  return (
    <div className="container mx-auto">
      <Table>
        {/* Show the owner of the group? */}
        <TableCaption>A list of groups you are part of.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="max-w-36">Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Pets, Houses, Plants</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <TableRow key={group.id}>
              <TableCell>
                <GroupRedirectButton groupId={group.id}>
                  {group.name}
                </GroupRedirectButton>
              </TableCell>
              <TableCell>{group.description?.substring(0, 20)}</TableCell>
              <TableCell>
                {group.members ? group.members.length : "No members"}
              </TableCell>
              <TableCell>
                {group.petIds ? group.petIds.length : 0}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
