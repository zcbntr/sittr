"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import * as React from "react";
import { type z } from "zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { createGroupFormSchema } from "~/lib/schema/index";
import { Textarea } from "~/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { type DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";

export default function CreateGroupDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  type Checked = DropdownMenuCheckboxItemProps["checked"];

  const [subjects, setSubjects] = React.useState([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = React.useState([]);
  const [subjectsEmpty, setSubjectsEmpty] = React.useState(false);

  const form = useForm<z.infer<typeof createGroupFormSchema>>({
    resolver: zodResolver(createGroupFormSchema),
  });

  React.useEffect(() => {
    async function fetchSubjects() {
      await fetch("api/sittingsubject?all=true")
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setSubjectsEmpty(true);
            console.error(data.error);
            return;
          }

          if (data.length > 0) {
            setSubjects(data);
          } else if (data.length === 0) {
            setSubjectsEmpty(true);
          }
        });
    }

    void fetchSubjects();
  }, []);

  async function onSubmit(data: z.infer<typeof createGroupFormSchema>) {
    const res = await fetch("api/group", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setOpen(false);
      document.dispatchEvent(new Event("groupCreated"));
    } else {
      console.log(res);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[454px]">
        <DialogHeader>
          <DialogTitle>Group Details</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-2/3 space-y-6"
            name="createPet"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jake's little helpers" {...field} />
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
                      placeholder="Friends who can pop round to feed Jake while we are away"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the group and its purpose. This will be visible to
                    users who join the group.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sittingSubjects"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Sitting For</FormLabel>
                  <DropdownMenu>
                    <DropdownMenuTrigger disabled={subjectsEmpty} asChild>
                      {/* Should reactively change based on whats selected */}
                      <Button variant="outline">
                        {!subjectsEmpty && subjects.length === 0 && (
                          <div>None</div>
                        )}
                        {!subjectsEmpty &&
                          subjects.length > 0 &&
                          subjects.length < 3 && (
                            <div>
                              {subjects[0].name + " and " + subjects[1].name}
                            </div>
                          )}
                        {subjects.length >= 3 && (
                          <div>
                            {subjects[0].name +
                              ", " +
                              subjects[1].name +
                              ", and more"}
                          </div>
                        )}
                        {subjectsEmpty && <div>None</div>}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {subjects.map(function (subject, i) {
                        return (
                          <DropdownMenuCheckboxItem
                            key={i}
                            checked={subject.id in selectedSubjectIds}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSubjectIds([
                                  ...selectedSubjectIds,
                                  subject.id,
                                ]);
                              } else {
                                setSelectedSubjectIds(
                                  selectedSubjectIds.filter(
                                    (sId) => sId !== subject.id,
                                  ),
                                );
                              }
                            }}
                          >
                            {subject.name}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <FormDescription>
                    Who or what the group will sit for.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={subjectsEmpty}>
                Create Group
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
