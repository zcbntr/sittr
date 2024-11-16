"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";

export default function Home() {
  const router = useRouter();

  const formSchema = z.object({
    inviteCode: z
      .string()
      .min(8, {
        message: "Invite codes are at least 8 characters long",
      })
      .max(12, {
        message: "Invite codes are at most 12 characters long",
      })
      .refine((value) => {
        return /^[a-zA-Z0-9]+$/.test(value);
      }, "Invite codes can only contain letters and numbers"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inviteCode: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    router.push(`/join-group/${values.inviteCode}`);

    form.reset();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Pet sitting made easy
        </h1>
        <div className="flex flex-col gap-8">
          <div className="flex flex-row place-content-center">
            <span className="text-2xl">
              Invite friends and family to sit for your pets and organise it all
              in one place.
            </span>
          </div>

          <div className="my-5 flex flex-row place-content-center gap-4">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="w-2/3 space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="inviteCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex w-full max-w-sm items-center space-x-2">
                            <Input
                              type="text"
                              placeholder="invite code"
                              {...field}
                            />
                            <Button type="submit">Join Group</Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8"></div>
      </div>
    </main>
  );
}
