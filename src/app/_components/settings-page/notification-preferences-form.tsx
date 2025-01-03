"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MdError } from "react-icons/md";
import { toast } from "sonner";
import { type z } from "zod";
import { useServerAction } from "zsa-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Switch } from "~/components/ui/switch";
import {
  updateNotificationPreferencesSchema,
  type SelectNotificationPreferences,
} from "~/lib/schemas/users";
import { updateNotificationPreferences } from "~/server/actions/account-actions";

export default function NotificationPreferencesForm({
  preferences,
}: {
  preferences: SelectNotificationPreferences | undefined;
}) {
  const form = useForm<z.infer<typeof updateNotificationPreferencesSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(updateNotificationPreferencesSchema),
    defaultValues: {
      ...preferences,
    },
  });

  if (!form.getValues().id) {
    return (
      <div className="flex h-[136px] w-full flex-row place-content-center px-1">
        <div className="flex flex-col place-content-center">
          <div className="flex flex-row place-content-center gap-2">
            <div className="flex flex-col place-content-center">
              <MdError />
            </div>{" "}
            Failed to load preferences
          </div>
        </div>
      </div>
    );
  }

  const { isPending, data, execute } = useServerAction(
    updateNotificationPreferences,
    {
      onError: ({ err }) => {
        toast.error(err.message);
      },
      onSuccess: () => {
        if (data) {
          form.setValue("emailUpcomingTasks", data?.emailUpcomingTasks);
          form.setValue("emailOverdueTasks", data?.emailOverdueTasks);
          form.setValue(
            "emailGroupMembershipChanges",
            data?.emailGroupMembershipChanges,
          );
          form.setValue("emailPetBirthdays", data?.emailPetBirthdays);
        }
      },
    },
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => execute(values))}
        className="h-full w-full space-y-4 px-1"
      >
        <div className="flex flex-col gap-3 px-3 text-lg">
          <FormField
            control={form.control}
            name="emailUpcomingTasks"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-between pr-1">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 flex flex-col place-content-center">
                    <FormLabel>Upcoming Tasks</FormLabel>
                  </div>

                  <div className="flex flex-col place-content-center">
                    <FormControl>
                      <Switch
                        disabled={isPending}
                        checked={field.value}
                        onCheckedChange={(e) => {
                          field.onChange(e);
                          execute(form.getValues());
                        }}
                      />
                    </FormControl>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emailOverdueTasks"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-between pr-1">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 flex flex-col place-content-center">
                    <FormLabel>Overdue Tasks</FormLabel>
                  </div>

                  <div className="flex flex-col place-content-center">
                    <FormControl>
                      <Switch
                        disabled={isPending}
                        checked={field.value}
                        onCheckedChange={(e) => {
                          field.onChange(e);
                          execute(form.getValues());
                        }}
                      />
                    </FormControl>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emailGroupMembershipChanges"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-between pr-1">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 flex flex-col place-content-center">
                    <FormLabel>Group Membership Changes</FormLabel>
                  </div>

                  <div className="flex flex-col place-content-center">
                    <FormControl>
                      <Switch
                        disabled={isPending}
                        checked={field.value}
                        onCheckedChange={(e) => {
                          field.onChange(e);
                          execute(form.getValues());
                        }}
                      />
                    </FormControl>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emailPetBirthdays"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-between pr-1">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 flex flex-col place-content-center">
                    <FormLabel>Pet Birthdays</FormLabel>
                  </div>

                  <div className="flex flex-col place-content-center">
                    <FormControl>
                      <Switch
                        disabled={isPending}
                        checked={field.value}
                        onCheckedChange={(e) => {
                          field.onChange(e);
                          execute(form.getValues());
                        }}
                      />
                    </FormControl>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}
