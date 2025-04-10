"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Textarea } from "~/components/ui/textarea";
import { type SelectGroupInput } from "~/lib/schemas/groups";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { updateGroupAction } from "~/server/actions/group-actions";
import { useServerAction } from "zsa-react";
import { toast } from "sonner";

export function GroupNameDescriptionForm({
  group,
}: {
  group: SelectGroupInput;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function exitEditMode() {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("editing");

    router.replace(`${pathname}?${nextSearchParams}`);
  }

  const schema = z.object({
    id: z.string(),
    name: z.string().max(100),
    description: z.string().max(1500),
  });

  const form = useForm<NonNullable<z.infer<typeof schema>>>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: group.id,
      name: group.name,
      description: group.description ? group.description : "",
    },
  });

  const { isPending, execute } = useServerAction(updateGroupAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Group details updated!");
      exitEditMode();
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => execute(values))}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="Jake's Little Helpers" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Friends of Jake who can help out by feeding and walking him."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-row gap-2">
          <Button type="submit" disabled={isPending}>
            <div className="flex flex-row gap-2">
              <div className="flex flex-col place-content-center">
                <MdEdit size={"1.2rem"} />
              </div>
              {isPending ? "Updating Group..." : "Update Group"}
            </div>
          </Button>

          <Button type="reset" onClick={exitEditMode} disabled={isPending}>
            <div className="flex flex-row gap-2">
              <div className="flex flex-col place-content-center">
                <MdCancel size={"1.2rem"} />
              </div>
              Cancel
            </div>
          </Button>
        </div>
      </form>
    </Form>
  );
}
