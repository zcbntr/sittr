"use client";

import { DataTable } from "~/components/ui/data-table";
import { type SelectPet } from "~/lib/schemas/pets";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

import { useState } from "react";
import { type SelectUser } from "~/lib/schemas/users";
import { initials } from "~/lib/utils";
import { MdPets } from "react-icons/md";

export default function PetsTable({
  user,
  pets,
}: {
  user: SelectUser;
  pets: SelectPet[];
}) {
  const [alertState, setAlertState] = useState("");

  const columns: ColumnDef<SelectPet>[] = [
    {
      accessorKey: "avatar",
      header: "",
      cell: ({ row }) => {
        const pet = row.original;

        console.log(pet);

        return (
          // Shrink div required to prevent link area being bigger than the avatar
          <div className="flex shrink">
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
          </div>
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
              <AlertDialogContent className="max-w-sm">
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
        {((user.plan === "Free" && pets.length < 2) ||
          (user.plan === "Plus" && pets.length < 10) ||
          (user.plan === "Pro" && pets.length < 1000)) && (
          <CreatePetDialog>
            <Button className="max-w-80">New Pet</Button>
          </CreatePetDialog>
        )}
        {(user.plan === "Free" && pets.length >= 5) ||
          (user.plan === "Plus" && pets.length >= 10) ||
          (user.plan === "Pro" && pets.length >= 1000 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="pointer-events-none inline-flex h-9 max-w-80 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50 ring-offset-background transition-colors">
                    New Pet
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    You have reached the limit of pets you can have with your{" "}
                    {user.plan} plan.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
      </DataTable>
    </div>
  );
}
