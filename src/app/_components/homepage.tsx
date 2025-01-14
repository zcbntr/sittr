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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";

import Link from "next/link";
import {
  MdCheck,
  MdOutlinePeopleOutline,
  MdOutlinePets,
  MdOutlineTask,
} from "react-icons/md";

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
      <div className="container flex min-h-screen flex-col items-center justify-center gap-12">
        <div>
          <div>
            GIF of sittr in action - possibly specific ones for small and large
            screens
          </div>
          <div className="flex flex-col place-content-between">
            Sittr makes organising pet sitting with the people you already trust
            easy.
          </div>
        </div>
        <div className="flex w-full flex-row place-content-center">
          <Tabs defaultValue="groups" className="w-full">
            <TabsList className="flex h-min w-full flex-row gap-5 bg-transparent pb-5">
              <TabsTrigger value="groups">
                <div className="flex flex-col gap-2 text-xl">
                  <div className="flex flex-row place-content-center">
                    <MdOutlinePeopleOutline size="icon" className="w-12" />
                  </div>
                  <div>Groups</div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="tasks">
                <div className="flex flex-col gap-2 text-xl">
                  <div className="flex flex-row place-content-center">
                    <MdOutlineTask size="icon" className="w-12" />
                  </div>
                  <div>Tasks</div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="pets">
                <div className="flex flex-col gap-2 text-xl">
                  <div className="flex flex-row place-content-center">
                    <MdOutlinePets size="icon" className="w-12" />
                  </div>
                  <div>Pets</div>
                </div>
              </TabsTrigger>
            </TabsList>
            <div className="flex w-full flex-row place-content-center bg-gray-950">
              <div className="w-full max-w-xl rounded-md p-3">
                <TabsContent value="groups">
                  <div className="flex flex-col gap-3">
                    <div className="text-lg font-bold">
                      Create groups of sitters you trust
                    </div>
                    <div className="flex flex-col gap-2 text-stone-300">
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-4" />
                        </div>
                        <div>Create groups for your pets</div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-4" />
                        </div>
                        <div>Invite friends and family you trust</div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-4" />
                        </div>
                        <div>
                          Manage group memberships to keep your pets in good
                          hands
                        </div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-4" />
                        </div>
                        <div>
                          Set invite link expiration and max uses for group
                          security
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="tasks">
                  <div className="flex flex-col gap-3">
                    <div className="text-lg font-bold">
                      Set tasks for your sitters
                    </div>
                    <div className="flex flex-col gap-2 text-stone-300">
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-4" />
                        </div>
                        <div>Create tasks for your groups to complete</div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-4" />
                        </div>
                        <div>
                          Upload instruction images to show sitters what to do
                        </div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-4" />
                        </div>
                        <div>
                          Sitters can claim tasks that they will complete
                        </div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-4" />
                        </div>
                        <div>
                          Get pictures of the completed task from the sitter who
                          completed it
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="pets">
                  <div className="flex flex-col gap-3">
                    <div className="text-lg font-bold">
                      Tell sitters about your pets
                    </div>
                    <div className="flex flex-col gap-2 text-stone-300">
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-4" />
                        </div>
                        <div>Create profiles for your pets</div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-4" />
                        </div>
                        <div>
                          Share information that can help sitters such as
                          feeding instructions, medical needs, and behavioural
                          quirks
                        </div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-4" />
                        </div>
                        <div>
                          Upload pictures of your pet to help sitters get to
                          know them
                        </div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-4" />
                        </div>
                        <div>
                          Manage who has access to your pet's details via shared
                          groups to ensure your pet is in good hands
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>

        <div className="flex flex-row flex-wrap place-content-center gap-6">
          <div className="text-3xl font-semibold">
            Frequently Asked Questions
          </div>
          <Accordion
            type="single"
            collapsible
            defaultValue="item-1"
            className="w-full max-w-xl"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-xl">
                Is sittr free?
              </AccordionTrigger>
              <AccordionContent className="text-pretty">
                Yes. Sittr is free to use for everyone. There are minimal limits
                on things like tasks created per week but no limits for sitters
                completing tasks.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-xl">
                What if I have a problem with something?
              </AccordionTrigger>
              <AccordionContent className="text-pretty">
                <div>
                  You can{" "}
                  <Link href="/support" className="underline">
                    contact support
                  </Link>{" "}
                  at any time. We aim to respond to all queries within 48 hours.
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
}
