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
  MdOutlineHandshake,
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
    <section className="text-pretty bg-gradient-to-b from-[#2e026d] from-10% via-[#0c0d19] via-65% to-[#27025b] pb-8 text-white sm:pb-0">
      <div className="container flex min-h-svh flex-col items-center justify-center gap-12">
        <div className="flex flex-row place-content-center">
          <h1 className="motion-safe:hover:animate-wiggle text-center text-[3rem] font-extrabold leading-none text-white antialiased duration-1000 motion-safe:hover:scale-110 sm:text-[5rem]">
            Pet sitting
            <div className="text-[2.5rem] italic tracking-tight sm:text-[3.5rem]">
              made easy
            </div>
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
      <div className="container flex min-h-screen flex-col items-center justify-center gap-20 tracking-wide">
        <div className="flex max-w-xl flex-col gap-6">
          <div className="-rotate-1 -skew-y-1 text-[1.5rem] font-medium duration-500 hover:rotate-[-1deg] hover:scale-125 sm:rotate-[-0.5deg] sm:skew-y-0">
            Forget the hassle of finding a trusted{" "}
            <span className="bg-violet-600 bg-opacity-50 text-[1.7rem] font-semibold italic">
              dog walker
            </span>
            ,{" "}
            <span className="bg-cyan-700 bg-opacity-50 text-[1.7rem] font-semibold italic">
              cat sitter
            </span>
            , or{" "}
            <span className="skew-y-6 bg-neutral-600 bg-opacity-50 text-[1.7rem] font-semibold italic">
              complicated auto feeder
            </span>
          </div>
          <div className="sm:skew-0 flex rotate-[1deg] skew-y-[0.5] flex-col pl-3 indent-3 text-lg duration-500 hover:scale-125 sm:rotate-[0.3deg] sm:px-5">
            Sittr makes organising pet sitting with the people you already trust
            easy.
          </div>
        </div>
        <div className="flex w-full flex-row place-content-center">
          <Tabs defaultValue="groups" className="w-full max-w-xl">
            <TabsList className="flex h-min w-full flex-row gap-2 bg-transparent pb-5 sm:place-content-between">
              <TabsTrigger value="groups">
                <div className="flex flex-col gap-2 text-xl">
                  <div className="flex flex-row place-content-center">
                    <MdOutlinePeopleOutline size="icon" className="w-10" />
                  </div>
                  <div>Groups</div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="tasks">
                <div className="flex flex-col gap-2 text-xl">
                  <div className="flex flex-row place-content-center">
                    <MdOutlineTask size="icon" className="w-10" />
                  </div>
                  <div>Tasks</div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="pets">
                <div className="flex flex-col gap-2 text-xl">
                  <div className="flex flex-row place-content-center">
                    <MdOutlinePets size="icon" className="w-10" />
                  </div>
                  <div>Pets</div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="sitters">
                <div className="flex flex-col gap-2 text-xl">
                  <div className="flex flex-row place-content-center">
                    <MdOutlineHandshake size="icon" className="w-10" />
                  </div>
                  <div>Sitters</div>
                </div>
              </TabsTrigger>
            </TabsList>
            <div className="flex w-full flex-row place-content-center bg-transparent">
              <div className="w-full max-w-xl rounded-md">
                <TabsContent value="groups">
                  <div className="flex flex-col gap-3">
                    <div className="text-xl font-bold">
                      Create groups of sitters you trust
                    </div>
                    <div className="flex flex-col gap-2 text-stone-300">
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-6" />
                        </div>
                        <div>Create groups for your pets</div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-6" />
                        </div>
                        <div>Invite friends and family you trust</div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-6" />
                        </div>
                        <div>
                          Manage group memberships to keep your pets in good
                          hands
                        </div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-6" />
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
                    <div className="text-xl font-bold">
                      Set tasks for your sitters
                    </div>
                    <div className="flex flex-col gap-2 text-stone-300">
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-6" />
                        </div>
                        <div>Create tasks for your groups to complete</div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-6" />
                        </div>
                        <div>
                          Customise task details, set which pet the task is for,
                          and when it is due
                        </div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-6" />
                        </div>
                        <div className="">
                          Get notified when your task is completed
                        </div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <div className="-mt-3 h-7 w-6 text-center text-3xl font-medium text-indigo-500">
                            +
                          </div>
                        </div>
                        <div className="text-indigo-500">
                          Upload instruction images to show sitters what to do
                        </div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <div className="-mt-3 h-7 w-6 text-center text-3xl font-medium text-indigo-500">
                            +
                          </div>
                        </div>
                        <div className="inline-block text-indigo-500">
                          Get pictures of the completed task from the sitter who
                          completed it
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="pets">
                  <div className="flex flex-col gap-3">
                    <div className="text-xl font-bold">
                      Tell sitters about your pets
                    </div>
                    <div className="flex flex-col gap-2 text-stone-300">
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-6" />
                        </div>
                        <div className="">Create profiles for your pets</div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-6" />
                        </div>
                        <div className="">
                          Share information that can help sitters such as
                          feeding instructions, medical needs, and behavioural
                          quirks
                        </div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-6" />
                        </div>
                        <div className="">
                          Manage who has access to your pet&apos;s details via
                          shared groups to ensure your pet is in good hands
                        </div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <div className="-mt-3 h-7 w-6 text-center text-3xl font-medium text-indigo-500">
                            +
                          </div>
                        </div>
                        <div className="text-indigo-500">
                          Upload pictures of your pet to help sitters get to
                          know them
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="sitters">
                  <div className="flex flex-col gap-3">
                    <div className="text-xl font-bold">
                      Sit for pets you care about
                    </div>
                    <div className="flex flex-col gap-2 text-stone-300">
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-6" />
                        </div>
                        <div>
                          Join a group from an invite link. Just ask a pet owner
                          to create a link
                        </div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-6" />
                        </div>
                        <div>
                          See upcomming tasks from the groups you are in on your{" "}
                          <Link href="sign-in" className="font-semibold">
                            dashboard
                          </Link>
                        </div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-6" />
                        </div>
                        <div>
                          Get notifications when a task is comming up or has
                          been missed
                        </div>
                      </div>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col place-content-center">
                          <MdCheck size="icon" className="w-6" />
                        </div>
                        <div>
                          Upload images to your completed tasks (owner requires{" "}
                          <Link href="plus" className="font-semibold">
                            sittr plus
                          </Link>
                          )
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>

        <div className="flex flex-row flex-wrap place-content-center gap-6 pb-5">
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
              <AccordionContent className="flex flex-col gap-2 px-2 text-lg">
                <div>
                  Yes. Sittr is free with minimal{" "}
                  <Link href="plus" className="font-semibold">
                    usage limits
                  </Link>{" "}
                  for owners and no limits for sitters completing tasks.
                </div>
                <div>
                  <Link href="plus" className="font-semibold">
                    Sittr plus
                  </Link>{" "}
                  is available for owners who need more frequent sitting.
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-xl">
                How do I invite someone to sit for my pet?
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2 px-2 text-lg">
                <div>
                  First create a group for your pet. This can be done from the{" "}
                  <Link href="my-groups" className="font-medium">
                    My Groups
                  </Link>{" "}
                  page.
                </div>{" "}
                <div>
                  From the group page, click the create invite button. This will
                  open a dialog with a link to copy and options for how long it
                  is valid for.
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-xl">
                How do I create a task?
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2 px-2 text-lg">
                <div>
                  From the{" "}
                  <Link href="sign-in" className="font-semibold">
                    dashboard
                  </Link>{" "}
                  click the create task button and fill in the required details.
                </div>
                <div>
                  You can choose between the task having a due date or spanning
                  a certain period. For example feeding a pet at a 6pm, or being
                  in the house from 6pm to 9pm for a pet.
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-xl">
                What if I have a problem with something?
              </AccordionTrigger>
              <AccordionContent className="px-2 text-lg">
                You can{" "}
                <Link href="/support" className="font-semibold">
                  contact support
                </Link>{" "}
                at any time. We aim to respond to all queries within 48 hours.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-xl">
                How do I get sittr?
              </AccordionTrigger>
              <AccordionContent className="px-2 text-lg">
                You can simply{" "}
                <Link href="/sign-in" className="font-semibold">
                  log in
                </Link>{" "}
                with your Google or Facebook account to get started. An account
                is needed in order to connect your sittr data to your email
                address.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
}
