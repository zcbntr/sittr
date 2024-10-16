import { type NextRequest, NextResponse } from "next/server";
import { createHouseFormSchema, basicGetAPIFormSchema, deleteAPIFormSchema } from "~/lib/schema";
import { createHouse, deleteHouse, getOwnedHouses } from "~/server/queries";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const requestParams = basicGetAPIFormSchema.safeParse({
      ids: req.nextUrl.searchParams.get("ids"),
      all: req.nextUrl.searchParams.get("all") === "true",
    });

    if (!requestParams.success) {
      console.log(
        "Owned Houses Form Data Parse Error: \n" +
          requestParams.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    if (requestParams.data.all) {
      const pets = await getOwnedHouses();

      return NextResponse.json(pets);
    }

    return NextResponse.json({ error: "Invalid request params" });
  } catch (error) {
    return NextResponse.json({ error });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = createHouseFormSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Create House Form Data Parse Error: \n" + formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRow = await createHouse(formData.data.name, formData.data.address);

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = editHouseFormSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Edit House Form Data Parse Error: \n" +
          formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRow = await updateHouse(
      formData.data.subjectId,
      formData.data.name,
      formData.data.sittingType,
      formData.data.dateRange.from,
      formData.data.dateRange.to,
    );

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = deleteAPIFormSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Delete House Form Data Parse Error: \n" +
          formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRow = await deleteHouse(formData.data.id);

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
