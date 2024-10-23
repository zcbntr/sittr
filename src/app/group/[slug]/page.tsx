"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { X, Plus, Pencil, Save } from "lucide-react";
import React from "react";
import { type Group, groupSchema, Pet, petListSchema } from "~/lib/schema";
import { GroupNameDescriptionForm } from "~/app/_components/group-page/name-description-form";

export default function Page({ params }: { params: { slug: string } }) {
  const [groupDoesNotExist, setGroupDoesNotExist] = useState(false);
  const [group, setGroup] = useState<Group>();
  const [members, setMembers] = useState([
    { id: 1, name: "Alice Johnson", avatar: "/placeholder-avatar-1.jpg" },
    { id: 2, name: "Bob Smith", avatar: "/placeholder-avatar-2.jpg" },
    { id: 3, name: "Carol Williams", avatar: "/placeholder-avatar-3.jpg" },
  ]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [petsEmpty, setPetsEmpty] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newPetName, setNewPetName] = useState("");
  const [newPetType, setNewPetType] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Update state upon props change, Update form value upon props change
  React.useEffect(
    () => {
      async function getData() {
        await fetchGroup();
        if (!groupDoesNotExist) {
          await fetchPets();
        }
      }

      // Get the data for the group from the slug
      async function fetchGroup() {
        await fetch("../api/groups?id=" + params.slug, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((res) => res.json())
          .then((json) => {
            console.log(json);
            if (json == null) {
              // No such group exists, set the flag
              setGroupDoesNotExist(true);
              return;
            }
          })
          .then((json) => groupSchema.safeParse(json))
          .then((validatedGroupObject) => {
            if (!validatedGroupObject.success) {
              console.error(validatedGroupObject.error.message);
              throw new Error("Failed to fetch group");
            }

            setGroup(validatedGroupObject.data);
          });
      }

      async function fetchPets() {
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
              setPetsEmpty(true);
            }
          });
      }

      // if (group) {
      //   if (props?.id) {
      //     form.setValue("id", props.id);
      //   }

      //   if (props?.ownerId) {
      //     form.setValue("ownerId", props.ownerId);
      //   }

      //   if (props?.dueMode !== undefined) {
      //     setDueMode(props.dueMode);
      //     form.setValue("dueMode", props.dueMode);
      //   }

      //   if (props?.dueDate) setDueDate(props?.dueDate);

      //   if (props?.dateRange)
      //     setDateRange({
      //       from: props?.dateRange?.from,
      //       to: props?.dateRange?.to,
      //     });

      //   if (props?.name) {
      //     form.setValue("name", props.name);
      //   }

      //   if (props?.description) {
      //     form.setValue("description", props.description);
      //   }

      //   if (props?.dueDate) {
      //     form.setValue("dueDate", props.dueDate);
      //   }

      //   if (props?.dateRange) {
      //     form.setValue("dateRange", {
      //       from: props?.dateRange?.from,
      //       to: props?.dateRange?.to,
      //     });
      //   }

      //   if (props?.groupId) {
      //     form.setValue("groupId", props.groupId);
      //   }
      // }

      // Fetch all possible sitting pets
      void getData();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
      {groupDoesNotExist && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h3 className="text-lg font-semibold">Group Not Found</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The group you are looking for does not exist.
            </p>
          </CardContent>
        </Card>
      )}

      {!groupDoesNotExist && isEditing && (
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
      )}

      {!groupDoesNotExist && !isEditing && (
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
          <div className="flex flex-wrap gap-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center space-x-2 rounded-md bg-secondary p-2"
              >
                <Avatar>
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{member.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMember(member.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex space-x-2">
            <Input
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="New member name"
            />
            <Button onClick={addMember}>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
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
          <div className="flex flex-wrap gap-4">
            {pets.map((pet) => (
              <div
                key={pet.id}
                className="flex items-center space-x-2 rounded-md bg-secondary p-2"
              >
                <Avatar>
                  <AvatarImage src={pet.avatar} alt={pet.name} />
                  <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div>{pet.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {pet.species}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePet(pet.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex space-x-2">
            <Input
              value={newPetName}
              onChange={(e) => setNewPetName(e.target.value)}
              placeholder="Pet name"
            />
            <Input
              value={newPetType}
              onChange={(e) => setNewPetType(e.target.value)}
              placeholder="Pet type"
            />
            <Button onClick={addPet}>
              <Plus className="mr-2 h-4 w-4" />
              Add Pet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
