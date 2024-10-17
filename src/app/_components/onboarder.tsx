"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

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
import { userPreferencesSchema } from "~/lib/schema";

export default function Onboarder() {
  const form = useForm<z.infer<typeof userPreferencesSchema>>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      wantPetSitting: false,
      wantHouseSitting: false,
      wantPlantSitting: false,
      wantBabySitting: false,
      sitForPets: false,
      sitForHouses: false,
      sitForPlants: false,
      sitForBabies: false,
    },
  });

  async function onSubmit(values: z.infer<typeof userPreferencesSchema>) {
    try {
      const res: Response = await fetch("/api/preferences", {
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "content-type": "application/json",
        },
      });

      const data: unknown = await res.json();
      console.log("no idea if it worked lol");
      console.log(data);

      // Redirect to the dashboard
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <h2 className="py-2 text-xs font-semibold">Owner Preferences</h2>
          <div className="flex flex-row gap-4 py-2">
            <FormField
              control={form.control}
              name="wantPetSitting"
              render={({ field }) => {
                return (
                  <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Pet Sitting</FormLabel>
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="wantHouseSitting"
              render={({ field }) => {
                return (
                  <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">House Sitting</FormLabel>
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="wantPlantSitting"
              render={({ field }) => {
                return (
                  <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Plant Sitting</FormLabel>
                  </FormItem>
                );
              }}
            />
          </div>
        </div>
        <div>
          <h2 className="pt-2 text-xs font-semibold">Sitter Preferences</h2>
          <div className="flex w-full grow flex-row place-items-start gap-4">
            <FormField
              control={form.control}
              name="sitForPets"
              render={({ field }) => {
                return (
                  <div className="flex flex-col place-content-center">
                    <FormItem className="flex flex-row items-start space-x-2 space-y-0 py-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Pet Sitting</FormLabel>
                    </FormItem>
                  </div>
                );
              }}
            />
            <FormField
              control={form.control}
              name="sitForHouses"
              render={({ field }) => {
                return (
                  <div className="flex flex-col place-content-center">
                    <FormItem className="flex flex-row items-start space-x-2 space-y-0 py-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        House Sitting
                      </FormLabel>
                    </FormItem>
                  </div>
                );
              }}
            />
            <FormField
              control={form.control}
              name="sitForPlants"
              render={({ field }) => {
                return (
                  <div className="flex flex-col place-content-center">
                    <FormItem className="flex flex-row items-start space-x-2 space-y-0 py-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Plant Sitting
                      </FormLabel>
                    </FormItem>
                  </div>
                );
              }}
            />
            {/* Should be far to the right - for some reason place-self-end doesn't work */}
            <div className="align-self-end right-0 flex h-full flex-col place-content-center place-self-end self-end justify-self-end">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-sm"
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
