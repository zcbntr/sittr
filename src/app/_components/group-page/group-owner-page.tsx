"use client";

import { useState } from "react";
import { GroupNameDescriptionForm } from "~/app/_components/group-page/name-description-form";
import { type Group, Pet, petListSchema, UserToGroup } from "~/lib/schema";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { X, Plus, Pencil, Save } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import React from "react";
import GroupPetsTable from "./group-pets-table";
import GroupMembersTable from "./group-members-table";

export function GroupOwnerPage({ group }: { group: Group }) {
  const [members, setMembers] = useState<UserToGroup[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [ownedPetsEmpty, setOwnedPetsEmpty] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newPetName, setNewPetName] = useState("");
  const [newPetType, setNewPetType] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  document.addEventListener("groupUpdated", () => {
    setIsEditing(false);
    // Invalidate the group data and refetch
  });

  document.addEventListener("cancelEdit", () => {
    setIsEditing(false);
  });

  React.useEffect(() => {
    // Get the owned pets of the user, who is the group owner, so they can be added to the group
    async function fetchOwnedPets() {
      await fetch("../api/pets?all=true", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((json) => petListSchema.safeParse(json))
        .then((validatedPetListObject) => {
          if (!validatedPetListObject.success) {
            console.error(validatedPetListObject.error.message);
            throw new Error("Failed to get pets");
          }

          if (validatedPetListObject.data.length > 0) {
            setPets(validatedPetListObject.data);
          } else if (validatedPetListObject.data.length === 0) {
            setOwnedPetsEmpty(true);
          }
        });
    }

    void fetchOwnedPets();
  }, []);

  const addMember = () => {
    if (newMemberName) {
      setMembers([
        ...members,
        {
          id: Date.now(),
          name: newMemberName,
          avatar: "/placeholder-avatar.jpg",
        },
      ]);
      setNewMemberName("");
    }
  };

  const removeMember = (id) => {
    setMembers(members.filter((member) => member.id !== id));
  };

  const addPet = () => {
    if (newPetName && newPetType) {
      setPets([
        ...pets,
        {
          id: Date.now(),
          name: newPetName,
          type: newPetType,
          avatar: "/placeholder-pet.jpg",
        },
      ]);
      setNewPetName("");
      setNewPetType("");
    }
  };

  const removePet = (id) => {
    setPets(pets.filter((pet) => pet.id !== id));
  };

  return (
    <div className="container mx-auto space-y-6 p-4">
      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h3 className="text-lg font-semibold">Edit Group Info</h3>
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
              <h3 className="text-lg font-semibold">{group?.name}</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{group?.description}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Group Info
            </Button>
          </CardFooter>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Group Members</CardTitle>
          <CardDescription>
            Manage the members of your pet sitting group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GroupMembersTable groupId={group.id} />

          {/* Make this shit work */}

          {/* <div className="flex space-x-2">
            <Input
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="New member name"
            />
            <Button onClick={addMember}>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div> */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pets</CardTitle>
          <CardDescription>
            Manage the pets your group takes care of
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GroupPetsTable groupId={group.id} />

          {/* Make this shit work */}

          {/* <div className="flex space-x-2">
            <Button onClick={addPet}>
              <Plus className="mr-2 h-4 w-4" />
              Add Pet
            </Button>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
