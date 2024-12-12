"use client";

import { DataTable } from "~/components/ui/data-table";
import { type Pet } from "~/lib/schemas/pets";
import CreatePetDialog from "./createpetdialog";
import { Button } from "~/components/ui/button";
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
import { deletePetAction } from "~/server/actions/pet-actions";
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
import { useState } from "react";

export default function PetsTable({ pets }: { pets: Pet[] }) {
  const [alertState, setAlertState] = useState("");

  const columns: ColumnDef<Pet>[] = [
    {
      accessorKey: "avatar",
      header: "",
      cell: ({ row }) => {
        const pet = row.original;

        return (
          <Link href={`/pets/${pet.id}`}>
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

        return (
          <Link href={`/pets/${pet.id}`}>
            <span>{pet.name}</span>
          </Link>
        );
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
                    onClick={async () =>
                      await navigator.clipboard.writeText(
                        `${pet.name} - ${pet.species} ${pet.breed ? "(" + pet.breed + ")" : ""}`,
                      )
                    }
                  >
                    Copy
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link
                      className="flex grow flex-row"
                      href={`pets/${pet.id}?editing=true`}
                    >
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      setAlertState(`delete-${pet.id}`);
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <AlertDialog open={alertState === `delete-${pet.id}`}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Confirm deletion of {pet.name}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action deletes{" "}
                    <span className="font-semibold">{pet.name}</span>. This
                    action cannot be undone. All groups and events associated
                    with <span className="font-semibold">{pet.name}</span> will
                    also be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={async () => setAlertState("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await deletePetAction({
                        petId: row.original.id,
                      });
                      setAlertState("");
                    }}
                  >
                    Delete
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
        data={pets}
        searchable={true}
        filterable={false}
      >
        <CreatePetDialog>
          <Button>New Pet</Button>
        </CreatePetDialog>
      </DataTable>
    </div>
  );
}
