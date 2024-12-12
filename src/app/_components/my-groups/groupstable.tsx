"use client";

import { DataTable } from "~/components/ui/data-table";
import CreateGroupDialog from "./creategroupdialog";
import { Button } from "~/components/ui/button";
import { type Group } from "~/lib/schemas/groups";
import JoinGroupDialog from "./join-group-dialog";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { useState } from "react";
import { leaveGroupAction } from "~/server/actions/group-actions";
import { GroupRoleEnum } from "~/lib/schemas";

export default function GroupsTable({ groups, userId }: { groups: Group[], userId: string }) {
  const [alertState, setAlertState] = useState("");

  const columns: ColumnDef<Group>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="p-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const group = row.original;

        return <Link href={`/groups/${group.id}`}>{group.name}</Link>;
      },
    },
    {
      accessorKey: "members",
      header: "Members",
      cell: ({ row }) => {
        const group = row.original;
        const filteredMembers = group.members?.filter(
          (x) => x.role != GroupRoleEnum.Values.Pending,
        );

        if (!filteredMembers) return <>No members</>;

        // Adjust to always show group owner first
        if (filteredMembers.length <= 3)
          return (
            <div className="flex flex-row gap-2">
              {filteredMembers.map((member) => (
                <Avatar key={member.groupId + member.user.id}>
                  <AvatarImage
                    src={member.user.image ? member.user.image : undefined}
                    alt={`${member.user.name}'s avatar`}
                  />
                  {/* Make this actually be the initials rather than first letter */}
                  <AvatarFallback>
                    {member.user.name?.substring(0, 1)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          );

        if (
          filteredMembers.length > 3 &&
          filteredMembers[0] &&
          filteredMembers[1]
        )
          return (
            <div className="flex flex-row gap-2">
              <Avatar>
                <AvatarImage
                  src={
                    filteredMembers[0].user.image
                      ? filteredMembers[0].user.image
                      : undefined
                  }
                  alt={`${filteredMembers[0].user.name}'s avatar`}
                />
                {/* Make this actually be the initials rather than first letter */}
                <AvatarFallback>
                  {filteredMembers[0].user.name?.substring(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col place-content-center">{`and ${filteredMembers.length - 1} more. `}</div>
            </div>
          );
      },
    },
    {
      accessorKey: "pets",
      header: "Pets",
      cell: ({ row }) => {
        const group = row.original;

        if (!group.pets) return <>No pets</>;

        if (group.pets.length <= 3)
          return (
            <div className="flex flex-row gap-2">
              {group.pets.map((pet) => (
                <Link href={`/pets/${pet.petId}`} key={pet.petId}>
                  <Avatar>
                    <AvatarImage src={pet.image} alt={`${pet.name}'s avatar`} />
                    {/* Make this actually be the initials rather than first letter */}
                    <AvatarFallback>{pet.name.substring(0, 1)}</AvatarFallback>
                  </Avatar>
                </Link>
              ))}
            </div>
          );

        if (group.pets.length > 3 && group.pets[0] && group.pets[1])
          return (
            <div className="flex flex-row gap-2">
              <Link href={`/pets/${group.pets[0].petId}`}>
                <Avatar>
                  <AvatarImage
                    src={group.pets[0].image}
                    alt={`${group.pets[0].name}'s avatar`}
                  />
                  {/* Make this actually be the initials rather than first letter */}
                  <AvatarFallback>
                    {group.pets[0].name.substring(0, 1)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex flex-col place-content-center">{`and ${group.pets.length - 1} more. `}</div>
            </div>
          );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const group = row.original;

        return (
          <>
            <div className="flex flex-row place-content-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={async () =>
                      await navigator.clipboard.writeText(
                        `${group.name} - Owned by ${group.members?.find((x) => x.role === GroupRoleEnum.Values.Owner)?.user.name} - ${group.description}`,
                      )
                    }
                  >
                    Copy
                  </DropdownMenuItem>
                  {/* Show only if not group owner */}
                  {group.members?.find((x) => x.user.id === userId)
                    ?.role === GroupRoleEnum.Values.Owner ? null : (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={async () => {
                          setAlertState(`leave-${group.id}`);
                        }}
                      >
                        Leave
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <AlertDialog open={alertState === `leave-${group.id}`}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Confirm leaving {group.name}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action removes you from{" "}
                    <span className="font-semibold">{group.name}</span>. You
                    will need to be re-invited to rejoin. You will no longer be
                    able to access information about any of the pets in the
                    group. Current group members will not be notified of your
                    departure.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={async () => setAlertState("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await leaveGroupAction({
                        groupId: group.id,
                      });
                      setAlertState("");
                    }}
                  >
                    Leave
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
      },
    },
  ];

  return (
    <div className="">
      <DataTable
        columns={columns}
        data={groups}
        searchable={true}
        filterable={false}
      >
        <CreateGroupDialog>
          <Button>New Group</Button>
        </CreateGroupDialog>

        <JoinGroupDialog>
          <Button variant="outline">Join Group</Button>
        </JoinGroupDialog>
      </DataTable>
    </div>
  );
}
