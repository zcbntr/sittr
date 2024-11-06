"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import * as React from "react";
import { type z } from "zod";
import { useForm } from "react-hook-form";
import {
  groupInviteCodeSchema,
} from "~/lib/schemas/groups";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { MdCopyAll } from "react-icons/md";
import { addDays } from "date-fns";
import { useToast } from "~/hooks/use-toast";
import { groupInviteLinkOptionsSchema } from "~/lib/schemas";

export default function CreateGroupInviteDialog({
  groupId,
  children,
}: {
  groupId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState<string | undefined>();

  const { toast } = useToast();

  const form = useForm<z.infer<typeof groupInviteLinkOptionsSchema>>({
    resolver: zodResolver(groupInviteLinkOptionsSchema),
    defaultValues: {
      linkId: undefined,
      groupId: groupId,
      maxUses: 1,
      expiresAt: addDays(new Date(), 7),
      requiresApproval: false,
    },
  });

  React.useEffect(() => {
    async function fetchGroupInvite() {
      await fetch("../api/group-invites", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId: form.getValues("groupId")
            ? form.getValues("groupId")
            : groupId,
          maxUses: form.getValues("maxUses") ? form.getValues("maxUses") : 1,
          expiresAt: form.getValues("expiresAt")
            ? form.getValues("expiresAt")
            : addDays(new Date(), 7),
          requiresApproval: form.getValues("requiresApproval")
            ? form.getValues("requiresApproval")
            : false,
        }),
      })
        .then((res) => res.json())
        .then((json) => groupInviteCodeSchema.safeParse(json))
        .then((validatedGroupInviteObject) => {
          if (!validatedGroupInviteObject.success) {
            console.error(validatedGroupInviteObject.error.message);
            throw new Error("Failed to fetch group invite");
          }

          setCode(validatedGroupInviteObject.data.code);
          form.setValue("linkId", validatedGroupInviteObject.data.id);
          form.setValue("maxUses", validatedGroupInviteObject.data.maxUses);
          form.setValue("expiresAt", validatedGroupInviteObject.data.expiresAt);
          form.setValue(
            "requiresApproval",
            validatedGroupInviteObject.data.requiresApproval,
          );
        });
    }

    void fetchGroupInvite();
  }, [groupId]);

  async function onSubmit(data: z.infer<typeof groupInviteLinkOptionsSchema>) {
    await fetch("../api/group-invites", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((json) => groupInviteCodeSchema.safeParse(json))
      .then((validatedGroupInviteObject) => {
        if (!validatedGroupInviteObject.success) {
          console.error(validatedGroupInviteObject.error.message);
          throw new Error("Failed to update group invite");
        }

        setCode(validatedGroupInviteObject.data.code);
        return;
      });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>New Group Invite Link</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input id="link" value={code} defaultValue="loading..." readOnly />
          </div>
          <Button
            type="submit"
            size="sm"
            className="px-3"
            onClick={async () =>
              // Copy the code to the clipboard and display a success toast
              {
                if (code) {
                  await navigator.clipboard.writeText(code);
                  toast({
                    title: "Code copied",
                    description: `${code}`,
                  });
                }
              }
            }
          >
            <span className="sr-only">Copy</span>
            <MdCopyAll className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
