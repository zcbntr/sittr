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
import Link from "next/link";

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
    <section className="bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex min-h-screen flex-col items-center justify-center gap-12">
        <div className="flex flex-row place-content-center">
          <h1 className="text-center text-4xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Pet sitting made easy
          </h1>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-row place-content-center">
            <span className="text-center text-2xl font-light">
              Invite <span className="font-medium">friends and family</span> to
              sit for your pets.
            </span>
          </div>

          <div className="mt-5 flex flex-row place-content-center gap-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="max-w-96 space-y-6 px-2"
              >
                <FormField
                  control={form.control}
                  name="inviteCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="grid w-full max-w-sm grid-cols-3 gap-3">
                          <Input
                            type="text"
                            placeholder="Invite code"
                            className="col-span-2"
                            {...field}
                          />

                          <Button type="submit" className="h-[40px] border">
                            Join Group
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
          <div className="mt-[-20px] flex flex-row place-content-center">
            <span>
              or{" "}
              <Link href="sign-in" className="underline">
                sign up as an owner
              </Link>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
