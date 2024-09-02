"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const formSchema = z.object({
  role: z.string(),
  pet: z.boolean(),
  house: z.boolean(),
  baby: z.boolean(),
  plant: z.boolean(),
});
export type OnboardingFormInput = z.infer<typeof formSchema>;

export default function Onboarder() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "owner",
      pet: false,
      house: false,
      baby: false,
      plant: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const isOwner = values.role == "owner";

    try {
      const res: Response = await fetch("/api/onboard", {
        method: "POST",
        mode: "cors",
        body: JSON.stringify(values),
        headers: {
          "content-type": "application/json",
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data = await res.json();
      if (data) {
        console.log(data);
      }

      // Redirect to the dashboard
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <div>
        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-2/3 space-y-6"
            >
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select>
                        {" "}
                        <SelectTrigger className="w-[180px]">
                          <SelectValue defaultValue="Owner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="sitter">Sitter</SelectItem>
                        </SelectContent>{" "}
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Set your owner or sitter preference.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pet</FormLabel>
                    <FormControl>
                      <Checkbox />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="house"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>House</FormLabel>
                    <FormControl>
                      <Checkbox />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="baby"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Baby</FormLabel>
                    <FormControl>
                      <Checkbox />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plant</FormLabel>
                    <FormControl>
                      <Checkbox />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}
