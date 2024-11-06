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
import { petSchema, type Pet } from "~/lib/schemas/pets";

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
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${pet.name} - ${pet.species} ${pet.breed ? "(" + pet.breed + ")" : ""}`,
                  )
                }
              >
                Copy
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link className="flex flex-row grow" href={"pets/" + pet.id}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  // Fix this at some point with another dialog
                  // eslint-disable-next-line no-alert
                  if (
                    window.confirm("Are you sure you want to delete this pet?")
                  ) {
                    await fetch("api/pets", {
                      method: "DELETE",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ id: row.original.id }),
                    })
                      .then((res) => res.json())
                      .then((json) => petSchema.safeParse(json))
                      .then((validatedPetObject) => {
                        if (!validatedPetObject.success) {
                          console.error(validatedPetObject.error.message);
                          throw new Error("Failed to delete pet");
                        }

                        document.dispatchEvent(new Event("petDeleted"));
                      });
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
