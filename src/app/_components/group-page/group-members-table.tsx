"use client";

import { DataTable } from "~/components/ui/data-table";
import React, { useState } from "react";
import CreateGroupInviteDialog from "./create-group-invite-dialog";
import { Button } from "~/components/ui/button";
import { type SelectBasicGroupMember } from "~/lib/schemas/groups";
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
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "~/components/ui/tooltip";
import { type SelectUser } from "~/lib/schemas/users";

export default function GroupMembersTable({
  user,
  groupId,
  groupMembers,
  isOwner,
}: {
  user: SelectUser;
  groupId: string;
  groupMembers: SelectBasicGroupMember[];
  isOwner?: boolean;
}) {
  const [alertState, setAlertState] = useState("");

  const columns: ColumnDef<SelectBasicGroupMember>[] = [
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
      {((user.plusMembership && groupMembers.length < 101) ||
        (!user.plusMembership && groupMembers.length < 6)) && (
        <CreateGroupInviteDialog groupId={groupId}>
          <Button className="max-w-80">Create Invite</Button>
        </CreateGroupInviteDialog>
      )}
      {user.plusMembership && groupMembers.length >= 101 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="pointer-events-none inline-flex h-9 max-w-80 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50 ring-offset-background transition-colors">
                Create Invite
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>You have reached the limit of group members you can have.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {!user.plusMembership && groupMembers.length >= 6 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="pointer-events-none inline-flex h-9 max-w-80 cursor-default items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50 ring-offset-background transition-colors">
                Create Invite
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                You have reached the limit of group members you can have without
                a Plus membership.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
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
