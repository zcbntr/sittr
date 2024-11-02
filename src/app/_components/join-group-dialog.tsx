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
import { useRouter } from "next/navigation";
import { fetchApi } from "~/lib/utils";
import {
  errorSchema,
  successSchema,
} from "../api/join-group/[slug]/route";
import { InviteApiError } from "~/server/queries/groups";
import { joinGroupFormSchema } from "~/lib/schemas/groups";

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
    const response = await fetchApi(
      "/api/join-group/" + data.inviteCode,
      successSchema,
      errorSchema,
    );

    if (response.status === "success") {
      router.refresh();
      setOpen(false);
    } else if (response.status === "error") {
      switch (response.error.errorType) {
        case InviteApiError.InviteNotFound:
          form.setError("inviteCode", {
            type: "manual",
            message: "Invite not found.",
          });
          break;
        case InviteApiError.Unauthorized:
          form.setError("inviteCode", {
            type: "manual",
            message: "Unauthorized.",
          });
          break;
        case InviteApiError.GroupNotFound:
          form.setError("inviteCode", {
            type: "manual",
            message: "Group not found.",
          });
          break;
        default:
          console.log("Unknown error occurred.");
      }
    }
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
