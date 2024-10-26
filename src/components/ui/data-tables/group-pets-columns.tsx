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
import {
  GroupPet,
  petToGroupSchema,
} from "~/lib/schema";

// Add a column for notes? Column for small image of pet?
export const columns: ColumnDef<GroupPet>[] = [
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
                    await fetch("../api/group-pets", {
                      method: "DELETE",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        groupId: row.original.groupId,
                        petId: row.original.petId,
                      }),
                    })
                      .then((res) => res.json())
                      .then((json) => petToGroupSchema.safeParse(json))
                      .then((validatedPetToGroupObject) => {
                        if (!validatedPetToGroupObject.success) {
                          console.error(
                            validatedPetToGroupObject.error.message,
                          );
                          throw new Error("Failed to remove pet");
                        }

                        document.dispatchEvent(new Event("petRemoved"));
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
