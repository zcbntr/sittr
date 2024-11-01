import { type NextRequest, NextResponse } from "next/server";
import {
  createPetFormSchema,
  basicGetAPIFormSchema,
  deleteAPIFormSchema,
  petSchema,
} from "~/lib/schema";
import {
  createPet,
  deletePet,
  getOwnedPets,
  updatePet,
} from "~/server/queries";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const requestParams = basicGetAPIFormSchema.safeParse({
      ids: searchParams.get("ids"),
      all: searchParams.get("all") === "true",
    });

    if (!requestParams.success) {
      throw new Error(
        "Get Pets Form Data Parse Error: \n" + requestParams.error.toString(),
      );
    }

    if (requestParams.data.all) {
      const petsOrErrorMessage = await getOwnedPets();

      if (typeof petsOrErrorMessage === "string") {
        return NextResponse.json({ error: petsOrErrorMessage });
      }

      return NextResponse.json(petsOrErrorMessage);
    }

    return NextResponse.json({ error: "Invalid request params" });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = createPetFormSchema.safeParse(json);

    if (!formData.success) {
      throw new Error(
        "Create Pet Form Data Parse Error: \n" + formData.error.toString(),
      );
    }

    const petOrErrorMessage = await createPet(formData.data);

    if (typeof petOrErrorMessage === "string") {
      return NextResponse.json({ error: petOrErrorMessage });
    }

    return NextResponse.json(petOrErrorMessage);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = petSchema.safeParse(json);

    if (!formData.success) {
      throw new Error(
        "Edit Pet Form Data Parse Error: \n" + formData.error.toString(),
      );
    }

    const petOrErrorMessage = await updatePet(formData.data);

    if (typeof petOrErrorMessage === "string") {
      return NextResponse.json({ error: petOrErrorMessage });
    }

    return NextResponse.json(petOrErrorMessage);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
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
      return NextResponse.json({ error: petOrErrorMessage });
    }

    return NextResponse.json(petOrErrorMessage);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
