"use client";

import { type Pet } from "~/lib/schemas/pets";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import React from "react";

export function PetNonOwnerPage({ pet }: { pet: Pet }) {
  return (
    <div className="container mx-auto space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <h3 className="text-lg font-semibold">{pet?.name}</h3>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground">{pet.species}</p>
            <p className="text-muted-foreground">{pet.breed}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
