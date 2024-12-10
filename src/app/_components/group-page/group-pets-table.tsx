"use client";

import { DataTable } from "~/components/ui/data-table";
import { type GroupPet } from "~/lib/schemas/groups";
import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import AddPetToGroupDialog from "./add-pet-to-group-dialog";
import { type Pet } from "~/lib/schemas/pets";
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
import { removePetFromGroupAction } from "~/server/actions/group-actions";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
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

export default function GroupPetsTable({
  groupId,
  groupPets,
  petsNotInGroup,
  isOwner,
}: {
  groupId: string;
  groupPets: GroupPet[];
  petsNotInGroup?: Pet[];
  isOwner?: boolean;
}) {
  const [alertState, setAlertState] = useState("");

  if (isOwner && !petsNotInGroup) {
    return null;
  }

  const memberColumns: ColumnDef<GroupPet>[] = [
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
        const pet = row.original;

        return <Link href={`/pets/${pet.petId}`}>{pet.name}</Link>;
      },
    },
    {
      accessorKey: "species",
      header: "Species",
    },
    {
      accessorKey: "breed",
      header: "Breed",
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        return (
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
                      `${row.original.name} - ${row.original.species} ${row.original.breed ? "(" + row.original.breed + ")" : ""}`,
                    )
                  }
                >
                  Copy
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const ownerColumns: ColumnDef<GroupPet>[] = [
    {
      accessorKey: "avatar",
      header: "",
      cell: ({ row }) => {
        const pet = row.original;

        return (
          <Link href={`/pets/${pet.petId}`}>
            <Avatar>
              <AvatarImage src={pet.image} alt={`${pet.name}'s avatar`} />
              {/* Make this actually be the initials rather than first letter */}
              <AvatarFallback>{pet.name.substring(0, 1)}</AvatarFallback>
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
        const pet = row.original;

        return <Link href={`/pets/${pet.petId}`}>{pet.name}</Link>;
      },
    },
    {
      accessorKey: "species",
      header: "Species",
    },
    {
      accessorKey: "breed",
      header: "Breed",
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const pet = row.original;

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
                        `${pet.name} - ${pet.species} ${pet.breed ? "(" + pet.breed + ")" : ""}`,
                      )
                    }
                  >
                    Copy
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      setAlertState(`remove-${pet.petId}`);
                    }}
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <AlertDialog open={alertState === `remove-${pet.petId}`}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Confirm removal of {pet.name}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action removes{" "}
                    <span className="font-semibold">{pet.name}</span> from the
                    group. This group&apos;s members will no longer have access
                    to information about this pet.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={async () => setAlertState("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await removePetFromGroupAction({
                        petId: row.original.petId,
                        groupId: row.original.group.groupId,
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

  return isOwner && petsNotInGroup ? (
    <DataTable
      columns={ownerColumns}
      data={groupPets}
      searchable={true}
      filterable={false}
    >
      <AddPetToGroupDialog groupId={groupId} petsNotInGroup={petsNotInGroup}>
        <Button>Add Pet</Button>
      </AddPetToGroupDialog>
    </DataTable>
  ) : (
    <DataTable
      columns={memberColumns}
      data={groupPets}
      searchable={true}
      filterable={true}
    />
  );
}
