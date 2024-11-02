import { type NextRequest, NextResponse } from "next/server";
import { basicGetAPIFormSchema, deleteAPIFormSchema } from "~/lib/schemas";
import {
  createPet,
  deletePet,
  getOwnedPets,
  getPetById,
  updatePet,
} from "~/server/queries/pets";
import { z } from "zod";
import { petSchema } from "~/lib/schemas/pets";

export const createPetFormSchema = z
  .object({
    name: z.string().min(3).max(50),
    species: z.string().min(3).max(50),
    breed: z.string().min(3).max(50).optional(),
    dob: z.coerce.date(),
  })
  .refine((data) => data.dob < new Date(), {
    message: "Birthdate must be in the past",
  })
  .refine((data) => data.dob > new Date("1900-01-01"), {
    message: "Birthdate must be after 1900-01-01",
  });

export type CreatePetFormInput = z.infer<typeof createPetFormSchema>;

export enum PetApiError {
  PetNotFound = "PetNotFound",
  InvalidCredentials = "InvalidCredentials",
  Unauthorized = "Unauthorized",
  // Add other expected error types as needed
}

export const successSchema = z.object({
  status: z.literal("success"),
  data: petSchema,
});

// Define your error schema using the enum values
export const errorSchema = z.object({
  status: z.literal("error"),
  errorType: z.nativeEnum(PetApiError),
});

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const requestParams = basicGetAPIFormSchema.safeParse({
      ids: searchParams.get("ids"),
      all: searchParams.get("all") === "true",
    });

    if (!requestParams.success) {
      return NextResponse.json(
        {
          status: "error",
          error: "Invalid request params",
        },
        { status: 400 },
      );
    }

    if (requestParams.data.all) {
      const petsOrErrorMessage = await getOwnedPets();

      if (typeof petsOrErrorMessage === "string") {
        return NextResponse.json(
          {
            status: "error",
            error: petsOrErrorMessage,
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { status: "success", data: petsOrErrorMessage },
        { status: 200 },
      );
    } else if (requestParams.data.id) {
      const petOrErrorMessage = await getPetById(requestParams.data.id);

      if (typeof petOrErrorMessage === "string") {
        return NextResponse.json(
          {
            status: "error",
            error: petOrErrorMessage,
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { status: "success", data: petOrErrorMessage },
        { status: 200 },
      );
    }

    return NextResponse.json({
      status: "error",
      error: "Invalid request params",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      status: 500,
      error: "Internal Server Error",
    });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = createPetFormSchema.safeParse(json);

    if (!formData.success) {
      return NextResponse.json(
        {
          status: "error",
          error: "Invalid pet data: " + formData.error.toString(),
        },
        { status: 400 },
      );
    }

    const petOrErrorMessage = await createPet(formData.data);

    if (typeof petOrErrorMessage === "string") {
      return NextResponse.json(
        { status: "error", error: petOrErrorMessage },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { status: "success", error: petOrErrorMessage },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { status: "error", error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = petSchema.safeParse(json);

    if (!formData.success) {
      return NextResponse.json(
        {
          status: "error",
          error: "Invalid pet data: " + formData.error.toString(),
        },
        { status: 400 },
      );
    }

    const petOrErrorMessage = await updatePet(formData.data);

    if (typeof petOrErrorMessage === "string") {
      return NextResponse.json(
        { status: "error", error: petOrErrorMessage },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      { status: "success", data: petOrErrorMessage },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { status: "error", error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = deleteAPIFormSchema.safeParse(json);

    if (!formData.success) {
      throw new Error(
        "Delete Pet Form Data Parse Error: \n" + formData.error.toString(),
      );
    }

    const petOrErrorMessage = await deletePet(formData.data.id);

    if (typeof petOrErrorMessage === "string") {
      return NextResponse.json(
        { status: "error", error: petOrErrorMessage },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { status: "success", data: petOrErrorMessage },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { status: "error", error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
