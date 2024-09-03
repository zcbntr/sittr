import { z } from "zod";

const SittingTypeEnum = z.enum(["Pet", "House", "Baby", "Plant"]);
export type SittingTypeEnum = z.infer<typeof SittingTypeEnum>;

const RoleEnum = z.enum(["Owner", "Sitter"]);
export type RoleEnum = z.infer<typeof RoleEnum>;

export const createSittingFormSchema = z
  .object({
    name: z.string(),
    dateRange: z.object(
      {
        from: z.date(),
        to: z.date(),
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
  });

export type CreateSittingFormInput = z.infer<typeof createSittingFormSchema>;

export const onboardingPreferencesFormSchema = z.object({
    role: RoleEnum,
    pet: z.boolean(),
    house: z.boolean(),
    baby: z.boolean(),
    plant: z.boolean(),
  });
  export type OnboardingFormInput = z.infer<typeof onboardingPreferencesFormSchema>;
