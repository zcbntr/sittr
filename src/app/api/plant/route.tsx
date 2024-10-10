import { type NextRequest, NextResponse } from "next/server";
import { createPlantFormSchema, basicGetAPIFormSchema } from "~/lib/schema";
import { createPlant, deletePlant, getOwnedPlants } from "~/server/queries";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const requestParams = basicGetAPIFormSchema.safeParse({
      ids: req.nextUrl.searchParams.get("ids"),
      all: req.nextUrl.searchParams.get("all") === "true",
    });

    if (!requestParams.success) {
      console.log(
        "Owned Plants Form Data Parse Error: \n" +
          requestParams.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    if (requestParams.data.all) {
      const pets = await getOwnedPlants();

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

    const formData = createPlantFormSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Create Plant Form Data Parse Error: \n" + formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRow = await createPlant(
      formData.data.name,
      formData.data.wateringFrequency,
      formData.data.species,
      formData.data.lastWatered,
    );

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = editPlantFormSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Edit Plant Form Data Parse Error: \n" + formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRow = await updatePlant(
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

    const formData = deletePlantFormSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Delete Plant Form Data Parse Error: \n" + formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRow = await deletePlant(formData.data.id);

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
