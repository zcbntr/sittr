"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import { MdDelete, MdCancel, MdEdit } from "react-icons/md";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { type Pet, petSchema } from "~/lib/schemas/pets";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "~/lib/utils";

export function PetEditForm({ pet }: { pet: Pet }) {
  const [deleteClicked, setDeleteClicked] = React.useState<boolean>(false);

  const [dob, setDOB] = React.useState<Date | undefined>();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof petSchema>>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      id: pet.id,
      ownerId: pet.ownerId,
      name: pet.name,
      species: pet.species,
      dob: pet.dob,
      breed: pet.breed,
    },
  });

  function exitEditMode() {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("editing");

    router.replace(`${pathname}?${nextSearchParams}`);
  }

  async function onSubmit(data: z.infer<typeof petSchema>) {
    if (deleteClicked) {
      await deletePet();
      return;
    }

    await fetch("../api/pets", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((json) => petSchema.safeParse(json))
      .then((validatedPetObject) => {
        if (!validatedPetObject.success) {
          console.error(validatedPetObject.error.message);
          throw new Error("Failed to update pet");
        }

        exitEditMode();
      });
  }

  async function deletePet() {
    // Fix this at some point with another dialog
    // eslint-disable-next-line no-alert
    if (window.confirm("Are you sure you want to delete this pet?")) {
      await fetch("../api/pets", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: pet.id }),
      })
        .then((res) => res.json())
        .then((json) => petSchema.safeParse(json))
        .then((validatedGroupObject) => {
          if (!validatedGroupObject.success) {
            console.error(validatedGroupObject.error.message);
            throw new Error("Failed to delete pet");
          }

          // Redirect to my pets page
          router.push("/my-pets");

          return;
        });
    }

    setDeleteClicked(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Jake" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="species"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Species</FormLabel>
              <FormControl>
                <Input placeholder="Dog" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="breed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Breed</FormLabel>
              <FormControl>
                <Input placeholder="Golden Retriever" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dob"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of Birth</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "justify-start text-left font-normal",
                        !dob && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="single"
                    onSelect={(e) => {
                      setDOB(e);
                      field.onChange(e);
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>Your pet&apos;s date of birth</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex grow flex-row place-content-between">
          <div className="flex flex-row gap-2">
            <Button type="submit">
              <div className="flex flex-row gap-2">
                <div className="flex flex-col place-content-center">
                  <MdEdit size={"1.2rem"} />
                </div>
                Update Pet
              </div>
            </Button>

            <Button
              type="reset"
              id="cancelPetEditButton"
              onClick={exitEditMode}
            >
              <div className="flex flex-row gap-2">
                <div className="flex flex-col place-content-center">
                  <MdCancel size={"1.2rem"} />
                </div>
                Cancel
              </div>
            </Button>
          </div>

          <Button
            id="deletePetButton"
            className="bg-red-600 hover:bg-red-700"
            onClick={async () => {
              setDeleteClicked(true);
              await deletePet();
            }}
          >
            <div className="flex flex-row gap-2">
              <div className="flex flex-col place-content-center">
                <MdDelete size={"1.2rem"} />
              </div>
              Delete Pet
            </div>
          </Button>
        </div>
      </form>
    </Form>
  );
}
