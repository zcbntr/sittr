import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "~/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { Checkbox } from "~/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { setUserPreferences } from "~/server/queries";

const formSchema = z.object({
  role: z.string(),
  pet: z.boolean(),
  house: z.boolean(),
  baby: z.boolean(),
  plant: z.boolean()
})

export default function Onboarder() {
  // const searchParams = useSearchParams();

  // const rawRoleUrlParam = searchParams.get("role");
  // let role = "owner";
  // let otherRole = "sitter";

  // if (rawRoleUrlParam === "owner") {
  // } else if (rawRoleUrlParam === "sitter") {
  //   role = "sitter";
  //   otherRole = "owner";
  // } else {
  //   // redirect to homepage
  // }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "owner",
      pet: false,
      house: false,
      baby: false,
      plant: false
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const isOwner = values.role == "owner";
    setUserPreferences(isOwner, values.pet, values.house, values.baby, values.plant);
  }

  return (
    <>
      <div>
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select>   <SelectTrigger className="w-[180px]">
                        <SelectValue defaultValue="Owner" />
                      </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="sitter">Sitter</SelectItem>
                        </SelectContent> </Select>
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
