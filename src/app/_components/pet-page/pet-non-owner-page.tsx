"use client";

import { type Pet } from "~/lib/schemas/pets";
import { Card, CardContent } from "~/components/ui/card";
import React from "react";
import { Textarea } from "~/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { getPetAgeString } from "~/lib/utils";

export function PetNonOwnerPage({ pet }: { pet: Pet }) {
  const petAgeString = getPetAgeString(pet.dob);
  return (
    <div className="container mx-auto space-y-6 p-4">
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-row flex-wrap place-content-center gap-8">
            <div className="flex max-w-[500px] flex-col place-content-between gap-2">
              <div className="flex flex-col gap-2">
                <Avatar className="h-56 w-56">
                  <AvatarImage
                    src={pet.image}
                    alt={`${pet.name}'s avatar`}
                    className="h-18"
                  />
                  {/* Make this actually be the initials rather than first letter */}
                  <AvatarFallback delayMs={600}>
                    {pet.name.substring(0, 1)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <p className="text-2xl font-semibold">{pet.name}</p>
                  <p className="pt-2 text-lg text-muted-foreground">
                    {pet.species}
                  </p>
                  <p className="text-lg text-muted-foreground">{pet.breed}</p>
                  <p className="text-lg text-muted-foreground">
                    {petAgeString} old
                  </p>
                </div>
              </div>
              <span id="padding" />
            </div>

            <div className="flex max-w-[800px] grow flex-col gap-2">
              <div className="text-xl">Notes</div>
              <div className="h-full w-full">
                <Textarea
                  placeholder={`The owner of this ${pet.name} has not written any notes about ${pet.name} yet.`}
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
