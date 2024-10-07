import { z } from "zod";

const SittingTypeEnum = z.enum(["Pet", "House", "Baby", "Plant"]);
export type SittingTypeEnum = z.infer<typeof SittingTypeEnum>;

const RoleEnum = z.enum(["Owner", "Sitter"]);
export type RoleEnum = z.infer<typeof RoleEnum>;

export const createSittingRequestFormSchema = z
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

export type CreateSittingRequestFormInput = z.infer<
  typeof createSittingRequestFormSchema
>;

export const editSittingRequestFormSchema = z
  .object({
    id: z.number(),
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

export type EditSittingRequestFormInput = z.infer<
  typeof editSittingRequestFormSchema
>;

export const deleteSittingRequestFormSchema = z.object({
  id: z.number(),
});

export type DeleteSittingRequestFormInput = z.infer<
  typeof deleteSittingRequestFormSchema
>;

export const createPetFormSchema = z.object({
  name: z.string().min(3).max(50),
  species: z.string().min(3).max(50),
  breed: z.string().min(3).max(50).optional(),
  birthdate: z.coerce.date(),
});

export type CreatePetFormInput = z.infer<typeof createPetFormSchema>;

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
