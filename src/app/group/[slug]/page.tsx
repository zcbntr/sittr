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
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { X, Plus, Pencil, Save } from "lucide-react";

export default function Component() {
  const [groupName, setGroupName] = useState("Pawsome Sitters");
  const [groupDescription, setGroupDescription] = useState(
    "A group of friends who love taking care of pets!",
  );
  const [members, setMembers] = useState([
    { id: 1, name: "Alice Johnson", avatar: "/placeholder-avatar-1.jpg" },
    { id: 2, name: "Bob Smith", avatar: "/placeholder-avatar-2.jpg" },
    { id: 3, name: "Carol Williams", avatar: "/placeholder-avatar-3.jpg" },
  ]);
  const [pets, setPets] = useState([
    { id: 1, name: "Max", type: "Dog", avatar: "/placeholder-pet-1.jpg" },
    { id: 2, name: "Whiskers", type: "Cat", avatar: "/placeholder-pet-2.jpg" },
    { id: 3, name: "Tweety", type: "Bird", avatar: "/placeholder-pet-3.jpg" },
  ]);
  const [newMemberName, setNewMemberName] = useState("");
  const [newPetName, setNewPetName] = useState("");
  const [newPetType, setNewPetType] = useState("");
  const [isEditing, setIsEditing] = useState(false);

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
            <div className="space-y-2">

              {/* Turn into form */}

              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description">Group Description</Label>
              <Textarea
                id="group-description"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Enter group description"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setIsEditing(false)}>
              <Pencil className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              <h3 className="text-lg font-semibold">{groupName}</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{groupDescription}</p>
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
                    {pet.type}
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
