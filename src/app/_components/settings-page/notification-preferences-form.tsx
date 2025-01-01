import { zodResolver } from "@hookform/resolvers/zod";
import { Form, useForm } from "react-hook-form";
import { toast } from "sonner";
import { type z } from "zod";
import { useServerAction } from "zsa-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Switch } from "~/components/ui/switch";
import {
  selectNotificationPreferencesSchema,
  type SelectNotificationPreferences,
} from "~/lib/schemas/users";
import { updateNotificationPreferences } from "~/server/actions/account-actions";

export default function NotificationPreferencesForm({
  preferences,
}: {
  preferences: SelectNotificationPreferences | undefined;
}) {
  const form = useForm<z.infer<typeof selectNotificationPreferencesSchema>>({
    resolver: zodResolver(selectNotificationPreferencesSchema),
    defaultValues: {
      ...preferences,
    },
  });

  if (!preferences) {
    return <div>Failed to load preferences</div>;
  }

  const { isPending, execute } = useServerAction(
    updateNotificationPreferences,
    {
      onError: ({ err }) => {
        toast.error(err.message);
      },
      onSuccess: () => {},
    },
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => execute(values))}
        className="h-full w-full space-y-4 px-1"
      >
        <div className="flex flex-col gap-3">
          <FormField
            control={form.control}
            name="emailUpcomingTasks"
            disabled={isPending}
            render={({ field }) => (
              <FormItem className="flex flex-col justify-between pr-1">
                <div className="flex flex-row gap-3">
                  <div className="flex flex-col place-content-center">
                    <FormLabel className="">Upcoming Tasks</FormLabel>
                  </div>

                  <div className="flex flex-col place-content-center">
                    <FormControl>
                      <Switch
                        checked={!field.value}
                        onCheckedChange={field.onChange}
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
            disabled={isPending}
            render={({ field }) => (
              <FormItem className="flex flex-col justify-between pr-1">
                <div className="flex flex-row gap-3">
                  <div className="flex flex-col place-content-center">
                    <FormLabel className="">Overdue Tasks</FormLabel>
                  </div>

                  <div className="flex flex-col place-content-center">
                    <FormControl>
                      <Switch
                        checked={!field.value}
                        onCheckedChange={field.onChange}
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
            disabled={isPending}
            render={({ field }) => (
              <FormItem className="flex flex-col justify-between pr-1">
                <div className="flex flex-row gap-3">
                  <div className="flex flex-col place-content-center">
                    <FormLabel className="">Group Membership Changes</FormLabel>
                  </div>

                  <div className="flex flex-col place-content-center">
                    <FormControl>
                      <Switch
                        checked={!field.value}
                        onCheckedChange={field.onChange}
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
            disabled={isPending}
            render={({ field }) => (
              <FormItem className="flex flex-col justify-between pr-1">
                <div className="flex flex-row gap-3">
                  <div className="flex flex-col place-content-center">
                    <FormLabel className="">Pet Birthdays</FormLabel>
                  </div>

                  <div className="flex flex-col place-content-center">
                    <FormControl>
                      <Switch
                        checked={!field.value}
                        onCheckedChange={field.onChange}
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
