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
import { type DateRange } from "react-day-picker";
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
import { Pet, petSchema, type SittingSubject } from "~/lib/schema/index";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";

export default function EditPetDialog({
  props,
  children,
}: {
  props?: Pet;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState<boolean>(false);
  const [dataChanged, setDataChanged] = React.useState<boolean>(false);

  const [dueDate, setDueDate] = React.useState<Date | undefined>();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

  const [deleteClicked, setDeleteClicked] = React.useState<boolean>(false);

  const form = useForm<z.infer<typeof petSchema>>({
    resolver: zodResolver(petSchema),
  });

  // Update state upon props change, Update form value upon props change
  React.useEffect(() => {
    if (props) {
      if (props?.petId) {
        form.setValue("petId", props.petId);
      }

      if (props?.subjectId) {
        form.setValue("subjectId", props.subjectId);
      }

      if (props?.ownerId) {
        form.setValue("ownerId", props.ownerId);
      }

      if (props?.name) {
        form.setValue("name", props.name);
      }

      if (props?.species) {
        form.setValue("species", props.species);
      }

      if (props?.breed) {
        form.setValue("breed", props.breed);
      }
    }
  }, [props]);

  async function onSubmit(data: z.infer<typeof petSchema>) {
    if (deleteClicked) {
      await deletePet();
      return;
    }

    await fetch("../api/pet", {
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

        document.dispatchEvent(new Event("petUpdated"));
      });
  }

  async function deletePet() {
    // Fix this at some point with another dialog
    // eslint-disable-next-line no-alert
    if (window.confirm("Are you sure you want to delete this pet?")) {
      const res = await fetch("api/pet", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: form.getValues().subjectId }),
      });

      if (res.ok) {
        setOpen(false);
        document.dispatchEvent(new Event("petDeleted"));
      } else {
        console.log(res);
      }

      setDeleteClicked(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[454px]">
        <DialogHeader>
          <DialogTitle>Edit Pet</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              console.log(form.getValues());
              void onSubmit(form.getValues());
            }}
            onChange={() => setDataChanged(true)}
            className="w-full space-y-6"
            name="editPet"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <div className="flex grow flex-row place-content-between">
                <Button
                  id="deletePetButton"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    setDeleteClicked(true);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#e8eaed"
                  >
                    <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                  </svg>
                </Button>
                <Button type="submit" disabled={!dataChanged}>
                  Update Pet
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
