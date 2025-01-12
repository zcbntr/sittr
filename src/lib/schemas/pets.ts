import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { petImages, petProfilePics, pets } from "~/server/db/schema";
import { type SelectUserInput, selectUserSchema } from "./users";

export const selectBasicPetProfilePicSchema = createSelectSchema(petProfilePics);

export type SelectBasicPetProfilePic = z.infer<typeof selectBasicPetProfilePicSchema>;

export const selectBasicPetImageSchema = createSelectSchema(petImages);

export type SelectBasicPetImage = z.infer<typeof selectBasicPetImageSchema>;

export const selectBasicPetSchema = createSelectSchema(pets);

export type SelectBasicPet = z.infer<typeof selectBasicPetSchema>;

export type SelectPetInput = z.input<typeof selectBasicPetSchema> & {
  creator?: SelectUserInput;
  owner?: SelectUserInput;
  profilePic?: SelectBasicPetProfilePic;
  images?: SelectBasicPetImage[];
};

export type SelectPetOutput = z.output<typeof selectBasicPetSchema> & {
  creator?: SelectUserInput;
  owner?: SelectUserInput;
  profilePic?: SelectBasicPetProfilePic;
  images?: SelectBasicPetImage[];
};

export const selectPetSchema: z.ZodType<
  SelectPetInput,
  z.ZodTypeDef,
  SelectPetOutput
> = selectBasicPetSchema.extend({
  creator: z.lazy(() => selectUserSchema).optional(),
  owner: z.lazy(() => selectUserSchema).optional(),
  profilePic: selectBasicPetProfilePicSchema.optional(),
  images: selectBasicPetImageSchema.array().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  dob: z.coerce.date().nullable(),
});

export type SelectPet = z.infer<typeof selectPetSchema>;

export const selectPetListSchema = selectPetSchema.array();

export type SelectPetList = z.infer<typeof selectPetListSchema>;

export const createPetSchema = createInsertSchema(pets)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    creatorId: true,
    ownerId: true,
    note: true,
  })
  .extend({
    name: z
      .string()
      .min(1, { message: "Your pet needs a name" })
      .max(50, { message: "Name must be less than 50 characters" }),
    species: z
      .string()
      .min(1, { message: "Your pet needs a species" })
      .max(50, {
        message: "Species must be less than 50 characters",
      }),
    image: z.string().optional(),
    breed: z.string().optional(),
    dob: z.coerce.date().optional(),
  })
  .refine((data) => !data.dob || data.dob < new Date(), {
    message: "Birthdate must be in the past",
    path: ["dob"],
  })
  .refine((data) => !data.dob || data.dob > new Date("1900-01-01"), {
    message: "Birthdate must be after 1900-01-01",
    path: ["dob"],
  });

export const updatePetSchema = createSelectSchema(pets)
  .partial()
  .refine((data) => data?.dob && data.dob < new Date(), {
    message: "Birthdate must be in the past",
  })
  .refine((data) => data?.dob && data.dob > new Date("1900-01-01"), {
    message: "Birthdate must be after 1900-01-01",
  });

export type EditPet = z.infer<typeof updatePetSchema>;
