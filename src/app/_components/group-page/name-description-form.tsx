"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import { MdDelete, MdCancel, MdEdit } from "react-icons/md";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { type Group, groupSchema } from "~/lib/schema";
import { useRouter } from "next/navigation";

export function GroupNameDescriptionForm({ group }: { group: Group }) {
  const [deleteClicked, setDeleteClicked] = React.useState<boolean>(false);

  const form = useForm<z.infer<typeof groupSchema>>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      id: group.id,
      name: group.name,
      description: group.description,
    },
  });

  useEffect(() => {
    // form.setValue("id", group.id);
    // form.setValue("name", group.name);
    // form.setValue("description", group.description);
  }, []);

  async function onSubmit(data: z.infer<typeof groupSchema>) {
    if (deleteClicked) {
      await deleteGroup();
      return;
    }

    await fetch("../api/groups", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((json) => groupSchema.safeParse(json))
      .then((validatedGroupObject) => {
        if (!validatedGroupObject.success) {
          console.error(validatedGroupObject.error.message);
          throw new Error("Failed to update group");
        }

        document.dispatchEvent(new Event("groupUpdated"));
      });
  }

  async function deleteGroup() {
    // Fix this at some point with another dialog
    // eslint-disable-next-line no-alert
    if (window.confirm("Are you sure you want to delete this group?")) {
      await fetch("../api/groups", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: group.id }),
      })
        .then((res) => res.json())
        .then((json) => groupSchema.safeParse(json))
        .then((validatedGroupObject) => {
          if (!validatedGroupObject.success) {
            console.error(validatedGroupObject.error.message);
            throw new Error("Failed to delete group");
          }

          document.dispatchEvent(new Event("groupDeleted"));

          // Redirect to /my-groups
          const router = useRouter();
          router.replace("/my-groups");
          return;
        });
    }

    setDeleteClicked(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
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

        <div className="flex grow flex-row place-content-between">
          <div className="flex flex-row gap-2">
            <Button type="submit">
              <div className="flex flex-row gap-2">
                <div className="flex flex-col place-content-center">
                  <MdEdit size={"1.2rem"} />
                </div>
                Update Group
              </div>
            </Button>

            <Button
              type="reset"
              id="cancelGroupEditButton"
              onClick={() => document.dispatchEvent(new Event("cancelEdit"))}
            >
              <div className="flex flex-row gap-2">
                <div className="flex flex-col place-content-center">
                  <MdCancel size={"1.2rem"} />
                </div>
                Cancel
              </div>
            </Button>
          </div>

          <Button
            id="deleteGroupButton"
            className="bg-red-600 hover:bg-red-700"
            onClick={() => {
              setDeleteClicked(true);
              deleteGroup();
            }}
          >
            <div className="flex flex-row gap-2">
              <div className="flex flex-col place-content-center">
                <MdDelete size={"1.2rem"} />
              </div>
              Delete Group
            </div>
          </Button>
        </div>
      </form>
    </Form>
  );
}
