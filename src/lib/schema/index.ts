import { z } from "zod";

const SittingTypeEnum = z.enum(["Pet", "House", "Baby", "Plant"]);
export type SittingTypeEnum = z.infer<typeof SittingTypeEnum>;

const RoleEnum = z.enum(["Owner", "Sitter"]);
export type RoleEnum = z.infer<typeof RoleEnum>;

export const createSittingFormSchema = z
  .object({
    name: z.string().min(3).max(50),
    dateRange: z.object(
      {
        from: z.coerce.date(),
        to: z.coerce.date(),
      },
      {
        required_error: "Please select a date or date range.",
      },
    ),
    sittingType: SittingTypeEnum,
  })
  .refine((data) => data.dateRange.from < data.dateRange.to, {
    path: ["dateRange"],
    message: "From date must be before to date",
  })
  .refine((data) => data.dateRange.from > new Date(), {
    path: ["dateRange"],
    message: "From date must be in the future",
  })
  .refine((data) => data.dateRange.to > new Date(), {
    path: ["dateRange"],
    message: "To date must be in the future",
  });

export type CreateSittingFormInput = z.infer<typeof createSittingFormSchema>;

export const onboardingPreferencesFormSchema = z.object({
  role: RoleEnum,
  pet: z.boolean(),
  house: z.boolean(),
  baby: z.boolean(),
  plant: z.boolean(),
});
export type OnboardingFormInput = z.infer<
  typeof onboardingPreferencesFormSchema
>;

export const dateRangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export type DateRange = z.infer<typeof dateRangeSchema>;