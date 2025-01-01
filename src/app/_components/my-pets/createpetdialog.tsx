"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import type { z } from "zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { toast } from "sonner";
import { useServerAction } from "zsa-react";
import { createPetAction } from "~/server/actions/pet-actions";
import { UploadButton } from "~/lib/uploadthing";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { createPetSchema } from "~/lib/schemas/pets";

export default function CreatePetDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  const [dob, setDOB] = React.useState<Date | undefined>();

  const [image, setImage] = React.useState<string | undefined>(undefined);

  const form = useForm<z.infer<typeof createPetSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(createPetSchema),
    defaultValues: {
      name: "",
      species: "",
      breed: "",
      dob: undefined,
      image: "",
    },
  });

  const { isPending, execute } = useServerAction(createPetAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Pet created!");
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="h-5/6 max-h-svh w-11/12 max-w-[450px] rounded-md sm:h-fit">
        <DialogHeader className="pb-2">
          <DialogTitle>New Pet</DialogTitle>
        </DialogHeader>
        <div className="h-full w-full space-y-2 px-1">
          <div>
            <div className="font-medium">Avatar</div>
            <div className="flex flex-col place-content-center gap-4">
              {image && (
                <div className="flex flex-row place-content-center">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={image} alt={`Your pet's avatar`} />
                    <AvatarFallback delayMs={600}>🐶</AvatarFallback>
                  </Avatar>
                </div>
              )}
              <UploadButton
                endpoint="unlinkedPetProfilePicUploader"
                onClientUploadComplete={(res) => {
                  // Do something with the response
                  if (res[0]?.serverData.imageId) {
                    form.setValue("image", res[0].serverData.imageId);
                    setImage(res[0].serverData.url);
                  } else {
                    toast.error("Image upload error");
                  }
                }}
                onUploadError={(error: Error) => {
                  // Do something with the error.
                  toast.error(`Image Upload Error! ${error.message}`);
                }}
              />
            </div>
          </div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => execute(values))}
              className="w-full space-y-4"
              name="createPet"
            >
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
                name="breed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Breed</FormLabel>
                    <FormControl>
                      <Input placeholder="Golden Retriever" {...field} />
                    </FormControl>
                    <FormDescription>
                      e.g. Husky, Siamese, etc. (Not required)
                    </FormDescription>
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
                    <Popover modal={true}>
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
                            date > new Date() || date < new Date("1900-01-01")
                          }
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

              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating Pet..." : "Create Pet"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
