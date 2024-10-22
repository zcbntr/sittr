"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import EditGroupDialog from "~/app/_components/editgroupdialog";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { groupSchema, type Group } from "~/lib/schema";

// Add a column for notes? Column for small image of pet?
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
    accessorKey: "membersCount",
    header: "Members",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const group = row.original;

      const [editGroupDialogProps, setEditGroupDialogProps] = useState<Group>();

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
                    `${group.name} - ${group.members?.length} members sitting for ${group.sittingSubjectIds?.length} pets, houses or plants`,
                  )
                }
              >
                Copy
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const button = document.getElementById(
                    "openEditGroupDialogHiddenButton",
                  );
                  if (button) {
                    setEditGroupDialogProps({
                      id: group.id,
                      name: group.name,
                      description: group.description,
                      members: group.members,
                      sittingSubjectIds: group.sittingSubjectIds,
                    });
                    button.click();
                  }
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  // Fix this at some point with another dialog
                  // eslint-disable-next-line no-alert
                  if (
                    window.confirm(
                      "Are you sure you want to delete this group?",
                    )
                  ) {
                    await fetch("api/group", {
                      method: "DELETE",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ id: row.original.id }),
                    })
                      .then((res) => res.json())
                      .then((json) => groupSchema.safeParse(json))
                      .then((validatedGroupObject) => {
                        if (!validatedGroupObject.success) {
                          console.error(validatedGroupObject.error.message);
                          throw new Error("Failed to delete group");
                        }

                        document.dispatchEvent(new Event("groupDeleted"));
                      });
                  }
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <EditGroupDialog props={editGroupDialogProps}>
            <Button id="openEditGroupDialogHiddenButton" className="hidden" />
          </EditGroupDialog>
        </>
      );
    },
  },
];
