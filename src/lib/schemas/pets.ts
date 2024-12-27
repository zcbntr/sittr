import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { petImages, pets } from "~/server/db/schema";
import { type SelectUserInput, selectUserSchema } from "./users";

export const selectBasicPetImageSchema = createSelectSchema(petImages);

export type SelectBasicPetImage = z.infer<typeof selectBasicPetImageSchema>;

export const selectBasicPetSchema = createSelectSchema(pets);

export type SelectBasicPet = z.infer<typeof selectPetSchema>;

export type SelectPetInput = z.input<typeof selectBasicPetSchema> & {
  creator?: SelectUserInput;
  owner?: SelectUserInput;
  profPic?: SelectBasicPetImage;
  images?: SelectBasicPetImage[];
};

export type SelectPetOutput = z.output<typeof selectBasicPetSchema> & {
  creator?: SelectUserInput;
  owner?: SelectUserInput;
  profPic?: SelectBasicPetImage;
  images?: SelectBasicPetImage[];
};

export const selectPetSchema: z.ZodType<
  SelectPetInput,
  z.ZodTypeDef,
  SelectPetOutput
> = selectBasicPetSchema.extend({
  creator: z.lazy(() => selectUserSchema).optional(),
  owner: z.lazy(() => selectUserSchema).optional(),
  profPic: selectBasicPetImageSchema.optional(),
  images: selectBasicPetImageSchema.array().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  dob: z.coerce.date(),
});

export type SelectPet = z.infer<typeof selectPetSchema>;

export const selectPetListSchema = selectPetSchema.array();

export type SelectPetList = z.infer<typeof selectPetListSchema>;

export const insertPetSchema = selectBasicPetSchema
  .extend({
    breed: z.string(),
  })
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
