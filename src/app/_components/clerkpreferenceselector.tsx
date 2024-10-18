"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { userPreferencesSchema } from "~/lib/schema";

export default function ClerkPreferenceSelector() {
  // Need a use effect to get the user's current preferences from the server

  const form = useForm<z.infer<typeof userPreferencesSchema>>({
    resolver: zodResolver(userPreferencesSchema),
  });

  React.useEffect(() => {
    async function fetchPreferences(): Promise<void> {
      await fetch("../api/preferences")
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.error(data.error);
            throw new Error("Failed to fetch preferences");
          }

          form.setValue("userId", data.userId);
          form.setValue("wantPetSitting", data.wantPetSitting);
          form.setValue("wantHouseSitting", data.wantHouseSitting);
          form.setValue("wantPlantSitting", data.wantPlantSitting);
          form.setValue("wantBabySitting", data.wantBabySitting);
          form.setValue("sitForPets", data.sitForPets);
          form.setValue("sitForHouses", data.sitForHouses);
          form.setValue("sitForPlants", data.sitForPlants);
          form.setValue("sitForBabies", data.sitForBabies);
        });
    }

    void fetchPreferences();
  }, [form]);

  async function onSubmit(data: z.infer<typeof userPreferencesSchema>) {
    const res = await fetch("../api/preferences", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      console.log(res);
      return;
    }

    const resData: unknown = await res.json();

    if (!resData.error) {
      document.dispatchEvent(new Event("preferencesUpdated"));
    } else {
      console.log(resData.error);
    }
  }

  return (
    <div>
      <div>
        <h1 className="font-bold">Preferences</h1>
      </div>
      <hr className="my-4 h-px border-0 bg-gray-200 dark:bg-gray-700"></hr>
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
                      <FormLabel className="font-normal">
                        House Sitting
                      </FormLabel>
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
                      <FormLabel className="font-normal">
                        Plant Sitting
                      </FormLabel>
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
                        <FormLabel className="font-normal">
                          Pet Sitting
                        </FormLabel>
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
    </div>
  );
}
