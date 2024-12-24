import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { pets } from "~/server/db/schema";
import { selectUserSchema } from "./users";

export const selectBasicPetSchema = createSelectSchema(pets);

export type SelectBasicPet = z.infer<typeof selectPetSchema>;

export const selectPetSchema = selectBasicPetSchema.merge(
  z.object({
    owner: selectUserSchema.optional(),
  }),
);

export const selectPetListSchema = z.array(selectPetSchema);

export type SelectPetList = z.infer<typeof selectPetListSchema>;

export const insertPetSchema = createInsertSchema(pets)
  .refine((data) => data.dob && data.dob < new Date(), {
    message: "Birthdate must be in the past",
  })
  .refine((data) => data.dob && data.dob > new Date("1900-01-01"), {
    message: "Birthdate must be after 1900-01-01",
  });

export type NewPet = z.infer<typeof insertPetSchema>;

export const updatePetSchema = createSelectSchema(pets)
  .partial()
  .refine((data) => data?.dob && data.dob < new Date(), {
    message: "Birthdate must be in the past",
  })
  .refine((data) => data?.dob && data.dob > new Date("1900-01-01"), {
    message: "Birthdate must be after 1900-01-01",
  });

export type EditPet = z.infer<typeof updatePetSchema>;
