"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import { MdCancel, MdEdit } from "react-icons/md";
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
import { type Pet, petSchema, SexEnum } from "~/lib/schemas/pets";
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
import { updatePetAction } from "~/server/actions/pet-actions";
import { useServerAction } from "zsa-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export function PetEditForm({ pet }: { pet: Pet }) {
  const [dob, setDOB] = React.useState<Date | undefined>();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function exitEditMode() {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("editing");

    router.replace(`${pathname}?${nextSearchParams}`);
  }

  const form = useForm<z.infer<typeof petSchema>>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      petId: pet.petId,
      ownerId: pet.ownerId,
      name: pet.name,
      species: pet.species,
      dob: pet.dob,
      breed: pet.breed,
    },
  });

  const { isPending, execute } = useServerAction(updatePetAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Pet details updated!");
      exitEditMode();
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => execute(values))}
        className="space-y-8"
      >
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
          name="sex"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sex</FormLabel>
              <Select onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sex" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={SexEnum.enum.Male.toString()}>
                    Male
                  </SelectItem>
                  <SelectItem value={SexEnum.enum.Female.toString()}>
                    Female
                  </SelectItem>
                  <SelectItem value={SexEnum.enum.Unspecified.toString()}>
                    Unspecified
                  </SelectItem>
                </SelectContent>
              </Select>
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

        <div className="flex flex-row gap-2">
          <Button type="submit" disabled={isPending}>
            <div className="flex flex-row gap-2">
              <div className="flex flex-col place-content-center">
                <MdEdit size={"1.2rem"} />
              </div>
              Update Pet
            </div>
          </Button>

          <Button type="reset" onClick={exitEditMode} disabled={isPending}>
            <div className="flex flex-row gap-2">
              <div className="flex flex-col place-content-center">
                <MdCancel size={"1.2rem"} />
              </div>
              Cancel
            </div>
          </Button>
        </div>
      </form>
    </Form>
  );
}
