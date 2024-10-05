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
import { add, format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { type DateRange } from "react-day-picker";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
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
import {
  createSittingFormSchema,
  type SittingTypeEnum,
} from "~/lib/schema/index";

export default function SittingDialogue({
  props,
  children,
}: {
  props?: {
    name?: string;
    sittingType?: SittingTypeEnum;
    dateRange?: DateRange;
  };
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  const defaultFromDate = add(new Date(), { hours: 1 });
  const defaultToDate = add(new Date(), { days: 1, hours: 1 });
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: props?.dateRange?.from ? props.dateRange.from : defaultFromDate,
    to: props?.dateRange?.to ? props.dateRange.to : defaultToDate,
  });

  const form = useForm<z.infer<typeof createSittingFormSchema>>({
    resolver: zodResolver(createSittingFormSchema),
  });

  // Update state upon props change, Update form value upon props change
  React.useEffect(
    () => {
      if (props) {
        setDateRange({
          from: props?.dateRange?.from ? props.dateRange.from : defaultFromDate,
          to: props?.dateRange?.to ? props.dateRange.to : defaultToDate,
        });

        form.setValue("dateRange", {
          from: props?.dateRange?.from ? props.dateRange.from : defaultFromDate,
          to: props?.dateRange?.to ? props.dateRange.to : defaultToDate,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props],
  );

  async function onSubmit(data: z.infer<typeof createSittingFormSchema>) {
    const res = await fetch("api/sittingrequest", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setOpen(false);
      dispatchEvent(new Event("sittingCreated"));
    } else {
      console.log(res);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[454px]">
        <DialogHeader>
          <DialogTitle>New Sitting</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-2/3 space-y-6"
            name="createSitting"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Pet sitting while I am away"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>e.g. Your pet&apos;s name</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          id="date"
                          variant={"outline"}
                          className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={(e) => {
                          console.log(dateRange);
                          setDateRange(e);
                          field.onChange(e);
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>The date(s) of your sitting</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sittingType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Sitting Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Pet" />
                        </FormControl>
                        <FormLabel className="font-normal">Pet</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="House" />
                        </FormControl>
                        <FormLabel className="font-normal">House</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Plant" />
                        </FormControl>
                        <FormLabel className="font-normal">Plant</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Create Sitting</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
