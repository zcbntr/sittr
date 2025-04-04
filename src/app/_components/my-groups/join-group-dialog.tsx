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
import { joinGroupFormSchema } from "~/lib/schemas/groups";
import { joinGroupAction } from "~/server/actions/group-actions";
import { toast } from "sonner";
import { useServerAction } from "zsa-react";

export default function JoinGroupDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  const form = useForm<z.infer<typeof joinGroupFormSchema>>({
    mode: "onBlur",
    resolver: zodResolver(joinGroupFormSchema),
    defaultValues: {
      inviteCode: "",
    },
  });

  const { isPending, execute } = useServerAction(joinGroupAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Group joined!");
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-svh w-5/6 overflow-y-scroll rounded-md sm:w-[460px]">
        <DialogHeader>
          <DialogTitle>Enter Group Invite Code</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => execute(values))}
            className="mt-4 w-full space-y-6 px-1"
            name="joinGroup"
          >
            <FormField
              control={form.control}
              name="inviteCode"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    You can request an invite code from the group owner. Certain
                    groups may require owner approval before you gain access.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                Join
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {isPending && <p>Joining group...</p>}
      </DialogContent>
    </Dialog>
  );
}
