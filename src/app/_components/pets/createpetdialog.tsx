"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { type z } from "zod";
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
import { createPetInputSchema } from "~/lib/schemas/pets";
import { toast } from "sonner";
import { useServerAction } from "zsa-react";
import { createPetAction } from "~/server/actions/pet-actions";

export default function CreatePetDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  const [dob, setDOB] = React.useState<Date | undefined>();

  const form = useForm<z.infer<typeof createPetInputSchema>>({
    mode: "onBlur",
    resolver: zodResolver(createPetInputSchema),
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

  React.useEffect(() => {
    localStorage.setItem(
      "createPetFormModified",
      form.formState.isDirty.toString(),
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-screen w-full overflow-y-scroll rounded-md sm:w-[533px]">
        <DialogHeader>
          <DialogTitle>New Pet</DialogTitle>
          <DialogDescription>
            Create a new pet. You can add more details later.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => execute(values))}
            className="w-2/3 space-y-6"
            name="createPet"
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
                  <FormDescription>
                    Your pet&apos;s date of birth
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                Save Pet
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {isPending && <div>Creating pet...</div>}
      </DialogContent>
    </Dialog>
  );
}
