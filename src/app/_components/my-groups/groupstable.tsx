"use client";

import { DataTable } from "~/components/ui/data-table";
import CreateGroupDialog from "./creategroupdialog";
import { Button } from "~/components/ui/button";
import type { SelectGroup } from "~/lib/schemas/groups";
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
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "~/components/ui/tooltip";
import { useState } from "react";
import { leaveGroupAction } from "~/server/actions/group-actions";
import { GroupRoleEnum } from "~/lib/schemas";
import { type SelectUser } from "~/lib/schemas/users";
import { initials } from "~/lib/utils";
import { MdPerson, MdPets } from "react-icons/md";

export default function GroupsTable({
  groups,
  user,
}: {
  groups: SelectGroup[];
  user: SelectUser;
}) {
  const [alertState, setAlertState] = useState("");

  const columns: ColumnDef<SelectGroup>[] = [
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
                <div
                  className="relative inline-block"
                  key={member.groupId + member.user?.id}
                >
                  <Avatar key={member.groupId + member.user?.id}>
                    <AvatarImage
                      src={member.user?.image ? member.user?.image : undefined}
                      alt={`${member.user?.name}'s avatar`}
                    />
                    <AvatarFallback>
                      {member.user?.name ? (
                        initials(member.user?.name)
                      ) : (
                        <MdPerson />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {member.user?.plusMembership && (
                    <div className="absolute right-0 top-0 -mr-1 -mt-1 flex h-5 w-5 items-center justify-center text-2xl font-bold text-violet-600">
                      +
                    </div>
                  )}
                </div>
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
              <div className="relative inline-block">
                <Avatar>
                  <AvatarImage
                    src={
                      filteredMembers[0].user?.image
                        ? filteredMembers[0].user.image
                        : undefined
                    }
                    alt={`${filteredMembers[0].user?.name}'s avatar`}
                  />
                  <AvatarFallback>
                    {filteredMembers[0].user?.name ? (
                      initials(filteredMembers[0].user?.name)
                    ) : (
                      <MdPerson />
                    )}
                  </AvatarFallback>
                </Avatar>
                {filteredMembers[0].user?.plusMembership && (
                  <div className="absolute right-0 top-0 -mr-1 -mt-1 flex h-5 w-5 items-center justify-center text-2xl font-bold text-violet-600">
                    +
                  </div>
                )}
              </div>
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

        if (!group.petsToGroups || group.petsToGroups?.length === 0)
          return <>No pets</>;

        if (group.petsToGroups.length <= 3)
          return (
            <div className="flex flex-row gap-2">
              {group.petsToGroups.map((petToGroup) => {
                const pet = petToGroup.pet;
                if (!pet) return null;
                return (
                  <Link href={`/pets/${pet.id}`} key={pet.id}>
                    <Avatar>
                      <AvatarImage
                        src={pet.profPic ? pet.profPic.url : ""}
                        alt={`${pet.name}'s avatar`}
                      />
                      <AvatarFallback>
                        {pet.name ? initials(pet.name) : <MdPets />}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                );
              })}
            </div>
          );

        if (
          group.petsToGroups.length > 3 &&
          group.petsToGroups[0]?.pet &&
          group.petsToGroups[1]?.pet
        )
          return (
            <div className="flex flex-row gap-2">
              <Link href={`/pets/${group.petsToGroups[0].pet.id}`}>
                <Avatar>
                  <AvatarImage
                    src={
                      group.petsToGroups[0].pet.profPic
                        ? group.petsToGroups[0].pet.profPic.url
                        : ""
                    }
                    alt={`${group.petsToGroups[0].pet.name}'s avatar`}
                  />
                  <AvatarFallback>
                    {group.petsToGroups[0].pet.name ? (
                      initials(group.petsToGroups[0].pet.name)
                    ) : (
                      <MdPets />
                    )}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex flex-col place-content-center">{`and ${group.petsToGroups.length - 1} more. `}</div>
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
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        `${group.name} - Owned by ${group.members?.find((x) => x.role === GroupRoleEnum.Values.Owner)?.user?.name} - ${group.description}`,
                      );
                    }}
                  >
                    Copy
                  </DropdownMenuItem>
                  {/* Show only if not group owner */}
                  {group.members?.find((x) => x.user?.id === user.id)?.role ===
                  GroupRoleEnum.Values.Owner ? null : (
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
              <AlertDialogContent className="max-w-sm">
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
        {((user.plusMembership && groups.length < 101) ||
          (!user.plusMembership && groups.length < 6)) && (
          <CreateGroupDialog>
            <Button className="max-w-80">New Group</Button>
          </CreateGroupDialog>
        )}
        {user.plusMembership && groups.length >= 101 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="pointer-events-none inline-flex h-9 max-w-80 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50 ring-offset-background transition-colors">
                  Create Group
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>You have reached the limit of groups you can have.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {!user.plusMembership && groups.length >= 6 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="pointer-events-none inline-flex h-9 max-w-80 cursor-default items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50 ring-offset-background transition-colors">
                  Create Group
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  You have reached the limit of groups you can have without a
                  Plus membership.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <JoinGroupDialog>
          <Button variant="outline">Join Group</Button>
        </JoinGroupDialog>
      </DataTable>
    </div>
  );
}
