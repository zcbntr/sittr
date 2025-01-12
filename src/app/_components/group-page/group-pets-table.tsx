"use client";

import { DataTable } from "~/components/ui/data-table";
import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import AddPetToGroupDialog from "./add-pet-to-group-dialog";
import { SelectPet } from "~/lib/schemas/pets";
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
import { type SelectUser } from "~/lib/schemas/users";
import { MdPets } from "react-icons/md";
import { initials } from "~/lib/utils";

export default function GroupPetsTable({
  user,
  groupId,
  groupPets,
  petsNotInGroup,
  isOwner,
}: {
  user: SelectUser;
  groupId: string;
  groupPets: SelectPet[];
  petsNotInGroup?: SelectPet[];
  isOwner?: boolean;
}) {
  const [alertState, setAlertState] = useState("");

  if (isOwner && !petsNotInGroup) {
    return null;
  }

  const petColumns: ColumnDef<SelectPet>[] = [
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

        return <Link href={`/pets/${pet.id}`}>{pet.name}</Link>;
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const ownerColumns: ColumnDef<SelectPet>[] = [
    {
      accessorKey: "avatar",
      header: "",
      cell: ({ row }) => {
        const pet = row.original;

        return (
          <Link href={`/pets/${pet.id}`}>
            <Avatar>
              <AvatarImage
                src={pet.profilePic ? pet.profilePic.url : ""}
                alt={`${pet.name}'s avatar`}
              />
              <AvatarFallback>
                {pet.name ? initials(pet.name) : <MdPets />}
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
        const pet = row.original;

        return <Link href={`/pets/${pet.id}`}>{pet.name}</Link>;
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
                      setAlertState(`remove-${pet.id}`);
                    }}
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <AlertDialog open={alertState === `remove-${pet.id}`}>
              <AlertDialogContent className="max-w-sm">
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
                        id: groupId,
                        petId: pet.id,
                        groupId: groupId,
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
        <Button className="max-w-80">Add Pet</Button>
      </AddPetToGroupDialog>
    </DataTable>
  ) : (
    <DataTable
      columns={petColumns}
      data={groupPets}
      searchable={true}
      filterable={true}
    />
  );
}
