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
import { type GroupPet } from "~/lib/schemas/groups";
import { removePetFromGroupAction } from "~/server/actions/group-actions";
import { Avatar, AvatarFallback, AvatarImage } from "../avatar";

// Add a column for notes? Column for small image of pet?
export const columns: ColumnDef<GroupPet>[] = [
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
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${row.original.name} - ${row.original.species} ${row.original.breed ? "(" + row.original.breed + ")" : ""}`,
                  )
                }
              >
                Copy
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  // Fix this at some point with another dialog
                  // eslint-disable-next-line no-alert
                  if (
                    window.confirm("Are you sure you want to remove this pet?")
                  ) {
                    await removePetFromGroupAction({
                      petId: row.original.petId,
                      groupId: row.original.groupId,
                    });
                  }
                }}
              >
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      );
    },
  },
];
