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
import { createHouseFormSchema, houseSchema } from "~/lib/schema/index";

export default function CreateHouseDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  const form = useForm<z.infer<typeof createHouseFormSchema>>({
    resolver: zodResolver(createHouseFormSchema),
  });

  async function onSubmit(data: z.infer<typeof createHouseFormSchema>) {
    await fetch("/api/house", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((json) => houseSchema.safeParse(json))
      .then((validatedHouseObject) => {
        if (!validatedHouseObject.success) {
          console.error(validatedHouseObject.error.message);
          throw new Error("Failed to create house");
        }

        document.dispatchEvent(new Event("houseCreated"));
      });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[454px]">
        <DialogHeader>
          <DialogTitle>New House</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
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
                    <Input placeholder="Smith Family Home" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="35 Example Road" {...field} />
                  </FormControl>
                  <FormDescription>(Not required)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save House</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
