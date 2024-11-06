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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import * as React from "react";
import { type z } from "zod";
import { useForm } from "react-hook-form";
import {
  DurationEnum,
  requestGroupInviteCodeFormInputSchema,
} from "~/lib/schemas/groups";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { MdCopyAll } from "react-icons/md";
import { useServerAction } from "zsa-react";
import { createGroupInviteCodeAction } from "~/server/actions/group-actions";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";

export default function CreateGroupInviteDialog({
  groupId,
  children,
}: {
  groupId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState<string | undefined>();

  const form = useForm<z.infer<typeof requestGroupInviteCodeFormInputSchema>>({
    mode: "onChange",
    resolver: zodResolver(requestGroupInviteCodeFormInputSchema),
    defaultValues: {
      groupId: groupId,
      maxUses: 1,
      expiresIn: DurationEnum.enum["1 Week"],
      requiresApproval: false,
    },
  });

  const { isPending, execute, data } = useServerAction(
    createGroupInviteCodeAction,
    {
      onError: ({ err }) => {
        toast.error(err.message);
      },
      onSuccess: () => {
        setCode(data?.code);
      },
    },
  );

  React.useEffect(() => {}, [groupId]);

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
            <Input
              id="link"
              value={isPending ? "" : code}
              defaultValue="loading..."
              readOnly
            />
          </div>

          <Button
            size="sm"
            className="px-3"
            onClick={async () =>
              // Copy the code to the clipboard and display a success toast
              {
                if (code) {
                  await navigator.clipboard.writeText(code);
                  toast("Code Copied", {
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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => execute(values))}
            onChange={form.handleSubmit((values) => execute(values))}
            className="w-full space-y-6"
          >
            <FormField
              control={form.control}
              name="maxUses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Uses</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiresIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expires In</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem
                        value={DurationEnum.enum["24 Hours"].toString()}
                      >
                        24 Hours
                      </SelectItem>
                      <SelectItem
                        value={DurationEnum.enum["48 Hours"].toString()}
                      >
                        48 Hours
                      </SelectItem>
                      <SelectItem
                        value={DurationEnum.enum["1 Week"].toString()}
                      >
                        1 Week
                      </SelectItem>
                      <SelectItem
                        value={DurationEnum.enum["1 Month"].toString()}
                      >
                        1 Month
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requiresApproval"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Requires Approval</FormLabel>
                    <FormDescription>
                      You will need to manually approve each user who requests
                      to join via the link.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
