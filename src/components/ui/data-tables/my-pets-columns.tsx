"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { type Pet } from "~/lib/schemas/pets";
import { deletePetAction } from "~/server/actions/pet-actions";

// Add a column for notes? Column for small image of pet?
export const columns: ColumnDef<Pet>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
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
                <Link className="flex grow flex-row" href={"pets/" + pet.petId}>
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  // Fix this at some point with another dialog
                  // eslint-disable-next-line no-alert
                  if (
                    window.confirm("Are you sure you want to delete this pet?")
                  ) {
                    await deletePetAction({ petId: pet.petId });
                  }
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      );
    },
  },
];
