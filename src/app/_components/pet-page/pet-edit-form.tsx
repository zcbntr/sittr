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
import { type Pet, SexEnum, updatePetSchema } from "~/lib/schemas/pets";
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
import { Card, CardContent } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";

export function PetEditForm({ pet }: { pet: Pet }) {
  const [dob, setDOB] = React.useState<Date | undefined>();
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
      petId: pet.petId,
      name: pet.name,
      species: pet.species,
      dob: pet.dob,
      breed: pet.breed,
      sex: pet.sex,
      note: pet.note,
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
    useServerAction(deletePetImageAction, {
      onError: ({ err }) => {
        toast.error(err.message);
      },
      onSuccess: () => {
        toast.success("Image deleted!");
      },
    });

  return (
    <Card className="w-min max-w-[1000px] sm:w-full">
      <CardContent className="p-8">
        <Form {...updateForm}>
          <form
            onSubmit={updateForm.handleSubmit((values) =>
              executeUpdate(values),
            )}
            className="space-y-2"
          >
            <div className="flex flex-row flex-wrap place-content-center gap-8">
              <div className="min-w-240px flex max-w-[500px] flex-col place-content-between gap-2">
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
                          <Input placeholder="Golden Retriever" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={updateForm.control}
                    name="sex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sex</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
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
                            <SelectItem
                              value={SexEnum.enum.Unspecified.toString()}
                            >
                              Unspecified
                            </SelectItem>
                          </SelectContent>
                        </Select>
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
                              captionLayout="dropdown"
                              mode="single"
                              fromDate={new Date("1900-01-01")}
                              toDate={new Date()}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
                              selected={field.value}
                              onSelect={(e) => {
                                setDOB(e);
                                field.onChange(e);
                              }}
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
                </div>
              </div>

              <div className="flex h-full max-w-[800px] grow flex-col gap-2">
                <div className="flex flex-row place-content-center gap-2">
                  <FormField
                    control={updateForm.control}
                    name="note"
                    disabled={updatePending}
                    render={({ field }) => (
                      <FormItem className="h-full sm:w-full">
                        <FormLabel className="text-xl">
                          Notes for Sitters
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={`Include information that will help sitters take care of ${pet.name}, such as allergies, behaviours, or a favourite toy.`}
                            className="w-240 max-h-full min-h-[250px] min-w-[270px] sm:h-[620px] sm:w-full"
                            {...field}
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
      </CardContent>
    </Card>
  );
}
