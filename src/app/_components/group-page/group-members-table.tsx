"use client";

import { DataTable } from "~/components/ui/data-table";
import React, { useState } from "react";
import CreateGroupInviteDialog from "./create-group-invite-dialog";
import { Button } from "~/components/ui/button";
import { type GroupMember } from "~/lib/schemas/groups";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  acceptPendingUserAction,
  rejectPendingUserAction,
  removeUserFromGroupAction,
} from "~/server/actions/group-actions";
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

export default function GroupMembersTable({
  groupId,
  groupMembers,
  isOwner,
}: {
  groupId: string;
  groupMembers: GroupMember[];
  isOwner?: boolean;
}) {
  const [alertState, setAlertState] = useState("");

  const columns: ColumnDef<GroupMember>[] = [
    {
      accessorKey: "avatar",
      header: "",
      cell: ({ row }) => {
        const member = row.original;

        return (
          <Link href={`/profile/${member.user.id}`}>
            <Avatar>
              <AvatarImage
                src={member.user.image ? member.user.image : undefined}
                alt={`${member.user.name}'s avatar`}
              />
              {/* Make this actually be the initials rather than first letter */}
              <AvatarFallback>
                {member.user.name?.substring(0, 1)}
              </AvatarFallback>
            </Avatar>
          </Link>
        );
      },
    },
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
        const member = row.original;

        return (
          <Link href={`/profile/${member.user.id}`}>{member.user.name}</Link>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const member = row.original;

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
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${member.user.name} - ${member.role}`,
                      )
                    }
                  >
                    Copy
                  </DropdownMenuItem>

                  {row.original.role === "Pending" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={async () => {
                          setAlertState(`accept-${member.user.id}`);
                        }}
                      >
                        Accept
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async () => {
                          await rejectPendingUserAction({
                            userId: member.user.id,
                            groupId: member.groupId,
                          });
                        }}
                      >
                        Deny
                      </DropdownMenuItem>
                    </>
                  )}

                  {row.original.role !== "Owner" &&
                    row.original.role !== "Pending" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={async () =>
                            setAlertState(`remove-${member.user.id}`)
                          }
                        >
                          Remove
                        </DropdownMenuItem>
                      </>
                    )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <AlertDialog open={alertState === `remove-${member.user.id}`}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Confirm removal of {member.user.name}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action removes{" "}
                    <span className="font-semibold">{member.user.name}</span>{" "}
                    from the group. This user will no longer have access to
                    group information, group tasks, and will no longer be able
                    to view the details of your pets that the group sits for.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={async () => setAlertState("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await removeUserFromGroupAction({
                        userId: member.user.id,
                        groupId: member.groupId,
                      });
                      setAlertState("");
                    }}
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={alertState === `accept-${member.user.id}`}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Confirm accepting of {member.user.name}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action adds{" "}
                    <span className="font-semibold">{member.user.name}</span> to
                    the group. This user will have access to group information,
                    group tasks, and will and will be able to view the details
                    of your pets that the group sits for.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={async () => setAlertState("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await acceptPendingUserAction({
                        userId: member.user.id,
                        groupId: member.groupId,
                      });
                      setAlertState("");
                    }}
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
      },
    },
  ];

  return isOwner ? (
    <DataTable
      columns={columns}
      data={groupMembers}
      searchable={true}
      filterable={false}
    >
      <CreateGroupInviteDialog groupId={groupId}>
        <Button className="max-w-80">Create Invite</Button>
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
