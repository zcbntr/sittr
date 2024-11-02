import { z } from "zod";

export const petSchema = z.object({
    id: z.string(),
    ownerId: z.string(),
    name: z.string(),
    species: z.string(),
    breed: z.string().optional(),
    dob: z.coerce.date(),
  });
  
  export type Pet = z.infer<typeof petSchema>;
  
  export const petListSchema = z.array(petSchema);
  
  export type PetList = z.infer<typeof petListSchema>;