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
import {
  deletePetImageAction,
  updatePetAction,
} from "~/server/actions/pet-actions";
import { useServerAction } from "zsa-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { UploadButton } from "~/lib/uploadthing";

export function PetEditForm({ pet }: { pet: Pet }) {
  const [dob, setDOB] = React.useState<Date | undefined>();
  const [recentUploadUrl, setRecentUploadUrl] = React.useState<
    string | undefined
  >(undefined);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { isPending: imageDeletePending, execute: executeDeleteImage } =
    useServerAction(deletePetImageAction, {
      onError: ({ err }) => {
        toast.error(err.message);
      },
      onSuccess: () => {
        toast.success("Image deleted!");
      },
    });

  function exitEditMode() {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("editing");

    router.replace(`${pathname}?${nextSearchParams}`);
    router.refresh();
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
      sex: pet.sex,
    },
  });

  const { isPending: updatePending, execute: executeUpdate } = useServerAction(
    updatePetAction,
    {
      onError: ({ err }) => {
        toast.error(err.message);
      },
      onSuccess: () => {
        toast.success("Pet details updated!");
        exitEditMode();
      },
    },
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row place-content-center">
          <Avatar className="h-36 w-36">
            <AvatarImage
              src={pet.image ?? recentUploadUrl}
              alt={`${pet.name}'s avatar`}
              className="h-18"
            />
            {/* Make this actually be the initials rather than first letter */}
            <AvatarFallback delayMs={600}>
              {pet.name.substring(0, 1)}
            </AvatarFallback>
          </Avatar>
        </div>

        {(pet.image ?? recentUploadUrl) && (
          <div className="flex flex-row place-content-center gap-2">
            <UploadButton
              endpoint="editPetImageUploader"
              input={{ petId: pet.petId }}
              onClientUploadComplete={(res) => {
                // Do something with the response
                if (res[0]?.serverData.url)
                  setRecentUploadUrl(res[0].serverData.url);
                else alert("Image Upload Error!");
              }}
              onUploadError={(error: Error) => {
                // Do something with the error.
                alert(`Image Upload Error! ${error.message}`);
              }}
            />

            <Button
              className="h-10 w-10"
              size="icon"
              disabled={imageDeletePending}
              onClick={async () => {
                await executeDeleteImage({ petId: pet.petId });
                setRecentUploadUrl(undefined);
              }}
            >
              <MdCancel />
            </Button>
          </div>
        )}

        {!pet.image && !recentUploadUrl && (
          <UploadButton
            endpoint="editPetImageUploader"
            input={{ petId: pet.petId }}
            onClientUploadComplete={(res) => {
              // Do something with the response
              if (res[0]?.serverData.url)
                setRecentUploadUrl(res[0].serverData.url);
              else alert("Image Upload Error!");
            }}
            onUploadError={(error: Error) => {
              // Do something with the error.
              alert(`Image Upload Error! ${error.message}`);
            }}
          />
        )}
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => executeUpdate(values))}
          className="space-y-2"
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
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
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-row gap-2 pt-2">
            <Button type="submit" disabled={updatePending}>
              <div className="flex flex-row gap-2">
                <div className="flex flex-col place-content-center">
                  <MdEdit size={"1.2rem"} />
                </div>
                Update Pet
              </div>
            </Button>

            <Button
              type="reset"
              onClick={exitEditMode}
              disabled={updatePending}
            >
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
    </div>
  );
}
