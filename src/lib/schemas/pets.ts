import { z } from "zod";

export const SexEnum = z.enum(["Male", "Female", "Unspecified"]);
export type SexEnum = z.infer<typeof SexEnum>;

export const petSchema = z.object({
  petId: z.string(),
  ownerId: z.string(),
  createdBy: z.string(),
  name: z.string(),
  species: z.string(),
  breed: z.string().optional(),
  dob: z.coerce.date(),
  sex: SexEnum.optional(),
  image: z.string().optional(),
  note: z.string().optional(),
});

export type Pet = z.infer<typeof petSchema>;

export const petListSchema = z.array(petSchema);

export type PetList = z.infer<typeof petListSchema>;

export const createPetInputSchema = z
  .object({
    name: z.string().min(3).max(50),
    species: z.string().min(3).max(50),
    breed: z.string().min(3).max(50).optional(),
    dob: z.coerce.date(),
    sex: SexEnum.optional(),
    image: z.string().optional(),
  })
  .refine((data) => data.dob < new Date(), {
    message: "Birthdate must be in the past",
  })
  .refine((data) => data.dob > new Date("1900-01-01"), {
    message: "Birthdate must be after 1900-01-01",
  });

export type CreatePetFormInput = z.infer<typeof createPetInputSchema>;

export const updatePetSchema = z.object({
  petId: z.string(),
  name: z.string(),
  species: z.string(),
  breed: z.string().optional(),
  dob: z.coerce.date(),
  sex: SexEnum.optional(),
});

export type UpdatePetFormInput = z.infer<typeof updatePetSchema>;

export const updatePetNoteSchema = z.object({
  petId: z.string(),
  note: z.string(),
});

export type UpdatePetNoteFormInput = z.infer<typeof updatePetNoteSchema>;