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
import { groupSchema, joinGroupFormSchema } from "~/lib/schema/index";
import { useRouter } from "next/navigation";

export default function JoinGroupDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  const router = useRouter();

  const form = useForm<z.infer<typeof joinGroupFormSchema>>({
    resolver: zodResolver(joinGroupFormSchema),
  });

  async function onSubmit(data: z.infer<typeof joinGroupFormSchema>) {
    const res = await fetch("/api/join-group", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    // Unexpected error
    if (!res.ok) {
      form.setError("inviteCode", {
        type: "manual",
        message: "Internal server error.",
      });
    }

    const json = await res.json();

    // Expected error
    if (json.error) {
      form.setError("inviteCode", {
        type: "manual",
        message: json.error,
      });
      return;
    }

    const validatedGroupObject = groupSchema.safeParse(json);
    if (!validatedGroupObject.success) {
      console.error(validatedGroupObject.error.message);
      throw new Error("Failed to join group");
    }

    router.refresh();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Join Group</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6"
            name="joinGroup"
          >
            <FormField
              control={form.control}
              name="inviteCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter an invite code to join a group. You can request an
                    invite code from the group owner.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Join</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
