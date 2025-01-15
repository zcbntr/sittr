"use client";

import { type SelectPet } from "~/lib/schemas/pets";
import { Card, CardContent } from "~/components/ui/card";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { getPetAgeString, initials } from "~/lib/utils";
import { MdPerson, MdPets } from "react-icons/md";

export function PetNonOwnerPage({ pet }: { pet: SelectPet }) {
  const petAgeString = pet.dob ? getPetAgeString(pet.dob) : null;
  return (
    <div className="container mx-auto w-full space-y-6 p-4">
      <div className="flex h-full w-full grow flex-row place-content-center">
        <Card className="w-full max-w-3xl">
          <CardContent className="w-full pb-6 pt-8">
            <div className="flex flex-row flex-wrap place-content-center gap-8 md:flex-nowrap">
              <div className="flex flex-col place-content-between gap-2 sm:max-w-64">
                <div className="flex flex-col gap-2">
                  <Avatar className="h-auto w-full max-w-64">
                    <AvatarImage
                      src={pet.profilePic ? pet.profilePic.url : ""}
                      alt={`${pet.name}'s avatar`}
                    />

                    <AvatarFallback delayMs={600}>
                      {pet.name ? initials(pet.name) : <MdPets />}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col gap-1">
                    <p className="text-2xl font-semibold">{pet.name}</p>
                    <p className="pt-2 text-xl text-muted-foreground">
                      {pet.species}{" "}
                      {pet.breed && (
                        <span className="align-bottom text-lg text-muted-foreground">
                          ({pet.breed})
                        </span>
                      )}
                    </p>
                    {petAgeString && (
                      <p className="text-lg text-muted-foreground">
                        {petAgeString} old
                      </p>
                    )}

                    <div className="flex flex-row gap-2 pt-2">
                      <div className="flex flex-col place-content-center">
                        <div className="relative inline-block">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={
                                pet.owner?.image ? pet.owner.image : undefined
                              }
                              alt={`${pet.owner?.name}'s avatar`}
                              className="h-18"
                            />

                            <AvatarFallback delayMs={600}>
                              {pet.owner?.name ? (
                                initials(pet.owner.name)
                              ) : (
                                <MdPerson />
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {pet.owner?.plusMembership && (
                            <div className="absolute right-0 top-0 -mr-1 -mt-1 flex h-5 w-5 items-center justify-center text-2xl font-bold text-violet-600">
                              +
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col place-content-center text-muted-foreground">
                        <div className="flex flex-col">
                          <div className="text-md">Owned By</div>{" "}
                          <div className="text-xl">{pet.owner?.name}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <span id="padding" />
              </div>

              <div className="flex w-full max-w-2xl grow flex-col gap-2">
                <div className="text-xl">Notes</div>
                <div className="w-240 flex h-full max-h-full min-h-96 min-w-64 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:h-[620px] sm:w-full md:text-sm">
                  {pet.note ??
                    `The owner of ${pet.name} has not written any notes.`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
