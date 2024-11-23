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
import { type GroupMember } from "~/lib/schemas/groups";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { removeUserFromGroupAction } from "~/server/actions/group-actions";

// Column for avatar?
export const columns: ColumnDef<GroupMember>[] = [
  {
    accessorKey: "avatar",
    header: "",
    cell: ({ row }) => {
      const member = row.original;

      return (
        <Link href={`/profile/${member.userId}`}>
          <Avatar>
            <AvatarImage src={member.avatar} alt={`${member.name}'s avatar`} />
            {/* Make this actually be the initials rather than first letter */}
            <AvatarFallback>{member.name.substring(0, 1)}</AvatarFallback>
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
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const member = row.original;

      return <Link href={`/profile/${member.userId}`}>{member.name}</Link>;
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
                    `${member.name} - ${member.role}`,
                  )
                }
              >
                Copy
              </DropdownMenuItem>

              {row.original.role !== "Owner" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      // Fix this at some point with another dialog
                      // eslint-disable-next-line no-alert
                      if (
                        window.confirm(
                          "Are you sure you want to remove this member?",
                        )
                      ) {
                        await removeUserFromGroupAction({
                          userId: member.userId,
                          groupId: member.groupId,
                        });
                      }
                    }}
                  >
                    Remove
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      );
    },
  },
];
