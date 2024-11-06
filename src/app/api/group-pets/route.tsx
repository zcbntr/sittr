import { type NextRequest, NextResponse } from "next/server";
import {
  basicGetAPIFormSchema,
} from "~/lib/schemas";
import {
  addPetsToGroup,
  addPetToGroup,
  getGroupPets,
  removePetFromGroup,
} from "~/server/queries";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const requestParams = basicGetAPIFormSchema.safeParse({
      id: searchParams.get("id"),
      ids: searchParams.get("ids"),
      all: searchParams.get("all") === "true",
    });

    if (!requestParams.success) {
      throw new Error(
        "Get Group Pets Form Data Parse Error: \n" +
          requestParams.error.toString(),
      );
    }

    if (requestParams.data.id) {
      const groupPetsOrErrorMessage = await getGroupPets(requestParams.data.id);

      if (typeof groupPetsOrErrorMessage === "string") {
        return NextResponse.json({ error: groupPetsOrErrorMessage });
      }

      return NextResponse.json(groupPetsOrErrorMessage);
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

    const formData = petToGroupFormInputSchema.safeParse(json);

    if (!formData.success) {
      const formData = petsToGroupFormInputSchema.safeParse(json);
      if (!formData.success) {
        throw new Error(
          "Add Pet or Pets To Group Form Data Parse Error: \n" +
            formData.error.toString(),
        );
      } else {
        const petToGroupListOrErrorMessage = await addPetsToGroup(
          formData.data,
        );

        if (typeof petToGroupListOrErrorMessage === "string") {
          return NextResponse.json({ error: petToGroupListOrErrorMessage });
        }

        return NextResponse.json(petToGroupListOrErrorMessage);
      }
    }

    const petToGroupOrErrorMessage = await addPetToGroup(formData.data);

    if (typeof petToGroupOrErrorMessage === "string") {
      return NextResponse.json({ error: petToGroupOrErrorMessage });
    }

    return NextResponse.json(petToGroupOrErrorMessage);
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

    const formData = petToGroupFormInputSchema.safeParse(json);

    if (!formData.success) {
      throw new Error(
        "Remove Pet From Group Form Data Parse Error: \n" +
          formData.error.toString(),
      );
    }

    const petToGroupOrErrorMessage = await removePetFromGroup(formData.data);

    if (typeof petToGroupOrErrorMessage === "string") {
      return NextResponse.json({ error: petToGroupOrErrorMessage });
    }

    return NextResponse.json(petToGroupOrErrorMessage);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
