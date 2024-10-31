import { type NextRequest, NextResponse } from "next/server";
import {
  basicGetAPIFormSchema,
  petsToGroupFormInputSchema,
  petToGroupFormInputSchema,
} from "~/lib/schema";
import {
  addPetsToGroup,
  addPetToGroup,
  getGroupPets,
  removePetFromGroup,
} from "~/server/queries";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const searchParams = await req.nextUrl.searchParams;
    const requestParams = basicGetAPIFormSchema.safeParse({
      id: searchParams.get("id"),
      ids: searchParams.get("ids"),
      all: searchParams.get("all") === "true",
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
      const formData = petsToGroupFormInputSchema.safeParse(json);
      if (!formData.success) {
        console.log(
          "Add Pet or Pets To Group Form Data Parse Error: \n" +
            formData.error.toString(),
        );
        throw new Error("Invalid form data");
      } else {
        const pgRows = await addPetsToGroup(formData.data);
        return NextResponse.json(pgRows);
      }
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
