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
  FormDescription,
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

  if (!form.getValues().id) {
    return (
      <div className="flex min-h-28 w-full flex-row place-content-center">
        <div className="flex flex-col place-content-center">
          <div className="flex flex-row place-content-center gap-3">
            <div className="flex flex-col place-content-center">
              <MdError />
            </div>{" "}
            Failed to load preferences
          </div>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => execute(values))}
        className="h-full w-full space-y-4"
      >
        <div className="flex flex-col gap-3 px-2 text-lg">
          <FormField
            control={form.control}
            name="emailUpcomingTasks"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-between">
                <div className="flex flex-row place-content-end gap-3">
                  <div className="flex flex-col">
                    <FormLabel className="text-base font-medium">
                      Upcoming Task Emails
                    </FormLabel>
                    <FormDescription className="text-sm">
                      Get reminders about upcoming tasks that you have claimed.
                    </FormDescription>
                  </div>

                  <div className="col-span-1 flex w-min flex-col place-content-center">
                    <FormControl>
                      <Switch
                        disabled={isPending}
                        checked={field.value}
                        onCheckedChange={(e) => {
                          field.onChange(e);
                          void execute(form.getValues());
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
              <FormItem className="flex flex-col justify-between">
                <div className="flex flex-row place-content-end gap-3">
                  <div className="flex w-full flex-col">
                    <FormLabel className="text-base font-medium">
                      Overdue Task Emails
                    </FormLabel>
                    <FormDescription className="text-sm">
                      Get reminders about tasks you have claimed that are
                      overdue.
                    </FormDescription>
                  </div>

                  <div className="flex flex-col place-content-center">
                    <FormControl>
                      <Switch
                        disabled={isPending}
                        checked={field.value}
                        onCheckedChange={(e) => {
                          field.onChange(e);
                          void execute(form.getValues());
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
              <FormItem className="flex flex-col justify-between">
                <div className="flex flex-row place-content-end gap-3">
                  <div className="flex w-full flex-col">
                    <FormLabel className="text-base font-medium">
                      Group Membership Emails
                    </FormLabel>
                    <FormDescription className="text-sm">
                      Get notified when you are added or removed from a group.
                    </FormDescription>
                  </div>

                  <div className="flex flex-col place-content-center">
                    <FormControl>
                      <Switch
                        disabled={isPending}
                        checked={field.value}
                        onCheckedChange={(e) => {
                          field.onChange(e);
                          void execute(form.getValues());
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
              <FormItem className="flex flex-col justify-between">
                <div className="flex flex-row place-content-end gap-3">
                  <div className="flex w-full flex-col">
                    <FormLabel className="text-base font-medium">
                      Pet Birthdays Emails
                    </FormLabel>
                    <FormDescription className="text-sm">
                      Get birthday messages for your pets.
                    </FormDescription>
                  </div>

                  <div className="flex flex-col place-content-center">
                    <FormControl>
                      <Switch
                        disabled={isPending}
                        checked={field.value}
                        onCheckedChange={(e) => {
                          field.onChange(e);
                          void execute(form.getValues());
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
