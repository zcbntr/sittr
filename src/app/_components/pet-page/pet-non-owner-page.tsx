"use client";

import { type SelectPet } from "~/lib/schemas/pets";
import { Card, CardContent } from "~/components/ui/card";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { getPetAgeString, initials } from "~/lib/utils";
import { MdPets } from "react-icons/md";

export function PetNonOwnerPage({ pet }: { pet: SelectPet }) {
  const petAgeString = pet.dob ? getPetAgeString(pet.dob) : null;
  return (
    <div className="container mx-auto space-y-6 p-4">
      <div className="flex h-full w-full grow flex-row place-content-center">
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-row flex-wrap place-content-center gap-8">
              <div className="flex max-w-[500px] flex-col place-content-between gap-2">
                <div className="flex flex-col gap-2">
                  <Avatar className="h-56 w-56">
                    <AvatarImage
                      src={pet.profilePic ? pet.profilePic.url : ""}
                      alt={`${pet.name}'s avatar`}
                      className="h-18"
                    />

                    <AvatarFallback delayMs={600}>
                      {pet.name ? initials(pet.name) : <MdPets />}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col">
                    <p className="text-2xl font-semibold">{pet.name}</p>
                    <p className="pt-2 text-lg text-muted-foreground">
                      {pet.species}
                    </p>
                    <p className="text-lg text-muted-foreground">{pet.breed}</p>
                    {petAgeString && (
                      <p className="text-lg text-muted-foreground">
                        {petAgeString} old
                      </p>
                    )}
                  </div>
                </div>
                <span id="padding" />
              </div>

              <div className="flex max-w-[800px] grow flex-col gap-2">
                <div className="text-xl">Notes</div>
                <div className="w-240 flex max-h-full min-h-[250px] min-w-[270px] rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:h-[620px] sm:w-full md:text-sm">
                  {pet.note ??
                    `The owner of this ${pet.name} has not written any notes about ${pet.name} yet.`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
