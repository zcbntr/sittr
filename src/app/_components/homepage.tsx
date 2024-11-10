"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useServerAction } from "zsa-react";
import { joinGroupAction } from "~/server/actions/group-actions";

export default function Home() {
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
            <InputWithButton />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8"></div>
      </div>
    </main>
  );
}

export function InputWithButton() {
  const FormSchema = z.object({
    inviteCode: z.string().min(2, {
      message: "Username must be at least 2 characters.",
    }),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      inviteCode: "",
    },
  });

  const { isPending, execute, error } = useServerAction(joinGroupAction, {});

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => execute(values))}
          className="w-2/3 space-y-6"
        >
          <FormField
            control={form.control}
            name="inviteCode"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input type="text" placeholder="invite code" {...field} />
                    <Button type="submit">Join Group</Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      {error && <div className="text-red-500">{error.message}</div>}
    </div>
  );
}
