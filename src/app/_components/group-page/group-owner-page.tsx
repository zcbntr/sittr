"use client";

import { GroupNameDescriptionForm } from "~/app/_components/group-page/group-details-form";
import type { GroupMember, Group } from "~/lib/schemas/groups";
import { MdEdit, MdDelete } from "react-icons/md";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import React from "react";
import GroupPetsTable from "./group-pets-table";
import GroupMembersTable from "./group-members-table";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { useServerAction } from "zsa-react";
import { deleteGroupAction } from "~/server/actions/group-actions";
import { toast } from "sonner";
import { type Pet } from "~/lib/schemas/pets";
import { type User } from "~/lib/schemas/users";

export function GroupOwnerPage({
  user,
  group,
  groupPets,
  petsNotInGroup,
  groupMembers,
}: {
  user: User;
  group: Group;
  groupPets: Pet[];
  petsNotInGroup: Pet[];
  groupMembers: GroupMember[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("editing");

  const { isPending, execute } = useServerAction(deleteGroupAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Group deleted!");
    },
  });

  return (
    <div className="container mx-auto space-y-6 p-4">
      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="text-lg font-semibold">Edit Group Info</div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <GroupNameDescriptionForm group={group} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="text-lg font-semibold">{group?.name}</div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                <p className="text-muted-foreground">{group?.description}</p>
                <div className="grid grow grid-cols-2 gap-2 md:flex md:flex-row md:flex-wrap md:place-content-between">
                  <Button onClick={() => router.replace("?editing=true")}>
                    <MdEdit className="mr-1 h-4 w-4" />
                    Edit Info
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <MdDelete className="mr-1 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Group</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogDescription>
                        Are you sure you want to delete this group? This action
                        cannot be undone.
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogAction
                          disabled={isPending}
                          onClick={async () => {
                            await execute({ groupId: group.id });
                          }}
                        >
                          Confirm
                        </AlertDialogAction>
                        <AlertDialogCancel disabled={isPending}>
                          Cancel
                        </AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <hr className="my-2 h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>

              <div className="flex flex-col">
                <div className="text-lg">Members</div>
                <GroupMembersTable
                  user={user}
                  groupId={group.id}
                  groupMembers={groupMembers}
                  isOwner
                />
              </div>

              <div className="flex flex-col">
                <div className="text-lg">Pets</div>
                <GroupPetsTable
                  user={user}
                  groupId={group.id}
                  groupPets={groupPets}
                  petsNotInGroup={petsNotInGroup}
                  isOwner
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
