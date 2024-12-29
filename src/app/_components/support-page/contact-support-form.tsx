"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { type z } from "zod";
import { useServerAction } from "zsa-react";
import { Button } from "~/components/ui/button";
import { DialogFooter } from "~/components/ui/dialog";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
  Form,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { SupportCategoryEnum, supportEmailSchema } from "~/lib/schemas";
import { SelectUser } from "~/lib/schemas/users";
import { sendSupportEmailAction } from "~/server/actions/email-actions";

export default function ContactSupportForm({
  user,
}: {
  user: SelectUser | undefined;
}) {
  const form = useForm<z.infer<typeof supportEmailSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(supportEmailSchema),
    defaultValues: {
      fullName: user?.name ? user.name : "",
      email: user?.email ? user.email : "",
      category: SupportCategoryEnum.enum["Other"],
      message: "",
    },
  });

  const { isPending, execute } = useServerAction(sendSupportEmailAction, {
    onError: ({ err }) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Support ticket created!");
    },
  });

  return (
    <section>
      <div className="mx-auto max-w-md">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => execute(values))}
            className="w-full space-y-4"
            name="createSupportRequest"
          >
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(SupportCategoryEnum.Values).map(
                        (category) => (
                          <SelectItem value={category} key={category}>
                            {category}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Request *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="My pet is not showing up..."
                      className="resize-auto"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe your problem in as much detail as possible.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                Send
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {isPending && <div>Sending...</div>}
      </div>
    </section>
  );
}
