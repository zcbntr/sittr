import { type NextRequest, NextResponse } from "next/server";
import {
  basicGetAPIFormSchema,
  petToGroupFormInputSchema,
} from "~/lib/schema";
import {
  addPetToGroup,
  getGroupPets,
  removePetFromGroup,
} from "~/server/queries";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const requestParams = basicGetAPIFormSchema.safeParse({
      id: req.nextUrl.searchParams.get("id"),
      ids: req.nextUrl.searchParams.get("ids"),
      all: req.nextUrl.searchParams.get("all") === "true",
    });

    if (!requestParams.success) {
      console.log(
        "Get Group Pets Form Data Parse Error: \n" +
          requestParams.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    if (requestParams.data.id) {
      const groupPets = await getGroupPets(requestParams.data.id);

      return NextResponse.json(groupPets);
    }

    return NextResponse.json({ error: "Invalid request params" });
  } catch (error) {
    return NextResponse.json({ error });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = petToGroupFormInputSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Add Pet To Group Form Data Parse Error: \n" +
          formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pet = await addPetToGroup(formData.data);

    return NextResponse.json(pet);
  } catch (error) {
    return NextResponse.json({ error });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = petToGroupFormInputSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Remove Pet From Group Form Data Parse Error: \n" +
          formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRow = await removePetFromGroup(formData.data);

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
