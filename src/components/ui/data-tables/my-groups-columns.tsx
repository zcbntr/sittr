"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { MoreHorizontal } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { type Group } from "~/lib/schemas/groups";
import { Avatar, AvatarFallback, AvatarImage } from "../avatar";
import Link from "next/link";

export const columns: ColumnDef<Group>[] = [
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
    accessorKey: "members",
    header: "Members",
    cell: ({ row }) => {
      const group = row.original;

      if (!group.members) return <>No members</>;

      if (group.members.length <= 3)
        return (
          <div className="flex flex-row gap-2">
            {group.members.map((member) => (
              <Avatar>
                <AvatarImage
                  src={member.avatar}
                  alt={`${member.name}'s avatar`}
                />
                {/* Make this actually be the initials rather than first letter */}
                <AvatarFallback>{member.name.substring(0, 1)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        );

      if (group.members.length > 3 && group.members[0] && group.members[1])
        return (
          <div className="flex flex-row gap-2">
            <Avatar>
              <AvatarImage
                src={group.members[0].avatar}
                alt={`${group.members[0].name}'s avatar`}
              />
              {/* Make this actually be the initials rather than first letter */}
              <AvatarFallback>
                {group.members[0].name.substring(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col place-content-center">{`and ${group.members.length - 1} more. `}</div>
          </div>
        );
    },
  },
  {
    accessorKey: "pets",
    header: "Pets",
    cell: ({ row }) => {
      const group = row.original;

      if (!group.pets) return <>No pets</>;

      if (group.pets.length <= 3)
        return (
          <div className="flex flex-row gap-2">
            {group.pets.map((pet) => (
              <Avatar>
                <AvatarImage src={pet.image} alt={`${pet.name}'s avatar`} />
                {/* Make this actually be the initials rather than first letter */}
                <AvatarFallback>{pet.name.substring(0, 1)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        );

      if (group.pets.length > 3 && group.pets[0] && group.pets[1])
        return (
          <div className="flex flex-row gap-2">
            <Avatar>
              <AvatarImage
                src={group.pets[0].image}
                alt={`${group.pets[0].name}'s avatar`}
              />
              {/* Make this actually be the initials rather than first letter */}
              <AvatarFallback>
                {group.pets[0].name.substring(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col place-content-center">{`and ${group.pets.length - 1} more. `}</div>
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
                    `${group.name} - Created by ${group.createdBy} - ${group.description}`,
                  )
                }
              >
                Copy
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      );
    },
  },
];
