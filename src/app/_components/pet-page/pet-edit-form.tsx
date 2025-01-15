"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import { MdCancel, MdEdit, MdPets } from "react-icons/md";
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
import { type SelectPet, updatePetSchema } from "~/lib/schemas/pets";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn, initials } from "~/lib/utils";
import {
  deletePetProfilePicAction,
  updatePetAction,
} from "~/server/actions/pet-actions";
import { useServerAction } from "zsa-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { UploadButton } from "~/lib/uploadthing";
import { Textarea } from "~/components/ui/textarea";

export function PetEditForm({ pet }: { pet: SelectPet }) {
  const [recentUploadUrl, setRecentUploadUrl] = React.useState<
    string | undefined
  >(undefined);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function exitEditMode() {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("editing");

    router.replace(`${pathname}?${nextSearchParams}`);
    router.refresh();
  }

  const updateForm = useForm<z.infer<typeof updatePetSchema>>({
    resolver: zodResolver(updatePetSchema),
    defaultValues: {
      id: pet.id,
      name: pet.name,
      species: pet.species,
      dob: pet.dob,
      breed: pet.breed,
      note: pet.note ? pet.note : undefined,
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

  const { isPending: imageDeletePending, execute: executeDeleteImage } =
    useServerAction(deletePetProfilePicAction, {
      onError: ({ err }) => {
        toast.error(err.message);
      },
      onSuccess: () => {
        toast.success("Image deleted!");
      },
    });

  return (
    <Form {...updateForm}>
      <form
        onSubmit={updateForm.handleSubmit((values) => executeUpdate(values))}
        className="flex h-full w-full max-w-3xl flex-col sm:w-full"
      >
        <div className="flex h-full flex-row flex-wrap place-content-center gap-8 sm:flex-nowrap">
          <div className="flex h-full w-64 grow flex-col place-content-between gap-4 sm:gap-12">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2">
                <div className="flex flex-row place-content-center">
                  <Avatar className="h-36 w-36">
                    <AvatarImage
                      src={pet.profilePic?.url ?? recentUploadUrl}
                      alt={`${pet.name}'s avatar`}
                      className="h-18"
                    />

                    <AvatarFallback delayMs={600}>
                      {pet.name ? initials(pet.name) : <MdPets />}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {(pet.profilePic?.url ?? recentUploadUrl) && (
                  <div className="flex flex-row place-content-center gap-2">
                    <UploadButton
                      endpoint="petProfilePicUploader"
                      input={{ petId: pet.id }}
                      onClientUploadComplete={(res) => {
                        // Do something with the response
                        if (res[0]?.serverData.url)
                          setRecentUploadUrl(res[0].serverData.url);
                        else toast.error("Image Upload Error!");
                      }}
                      onUploadError={(error: Error) => {
                        // Do something with the error.
                        toast.error(`Image Upload Error! ${error.message}`);
                      }}
                    />

                    <Button
                      className="h-10 w-10"
                      size="icon"
                      disabled={imageDeletePending}
                      onClick={async () => {
                        await executeDeleteImage({ id: pet.id });
                        setRecentUploadUrl(undefined);
                      }}
                    >
                      <MdCancel />
                    </Button>
                  </div>
                )}

                {!pet.profilePic?.url && !recentUploadUrl && (
                  <UploadButton
                    endpoint="petProfilePicUploader"
                    input={{ petId: pet.id }}
                    onClientUploadComplete={(res) => {
                      // Do something with the response
                      if (res[0]?.serverData.url)
                        setRecentUploadUrl(res[0].serverData.url);
                      else toast.error("Image Upload Error!");
                    }}
                    onUploadError={(error: Error) => {
                      // Do something with the error.
                      toast.error(`Image Upload Error! ${error.message}`);
                    }}
                  />
                )}
              </div>

              <FormField
                control={updateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Jake" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="species"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Species *</FormLabel>
                    <FormControl>
                      <Input placeholder="Dog" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="breed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Breed</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Golden Retriever"
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="dob"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Birth</FormLabel>
                    <Popover modal={true}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                              "justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
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
                          captionLayout="dropdown"
                          mode="single"
                          fromDate={new Date("1900-01-01")}
                          toDate={new Date()}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          selected={field.value ? field.value : undefined}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-row flex-wrap place-content-center gap-3 sm:mt-0">
              <Button
                type="submit"
                disabled={updatePending}
                className="w-full min-w-24"
              >
                <MdEdit className="w-4" />
                {updatePending ? "Updating..." : "Update"}
              </Button>

              <Button
                type="reset"
                onClick={exitEditMode}
                disabled={updatePending}
                className="w-full min-w-24"
              >
                <MdCancel className="w-4" />
                Cancel
              </Button>
            </div>
          </div>

          <div className="flex h-full w-full max-w-2xl grow flex-col gap-2">
            <div className="flex w-full flex-row place-content-center gap-2">
              <FormField
                control={updateForm.control}
                name="note"
                disabled={updatePending}
                render={({ field }) => (
                  <FormItem className="h-full w-full">
                    <FormLabel className="text-xl">Notes for Sitters</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={`Include information that will help sitters take care of ${pet.name}, such as allergies, behaviours, or a favourite toy.`}
                        className="max-h-full min-h-[250px] w-full sm:h-[620px] sm:min-w-96"
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
