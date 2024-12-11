import { type NextRequest, NextResponse } from "next/server";
import { basicGetAPIFormSchema } from "~/lib/schemas";
import { getOwnedPets, getPetById } from "~/server/queries/pets";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const requestParams = basicGetAPIFormSchema.safeParse({
      id: searchParams.get("id"),
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
      const pets = await getOwnedPets();

      return NextResponse.json(pets);
    } else if (requestParams.data.id) {
      const pet = await getPetById(requestParams.data.id);

      return NextResponse.json(pet);
    }

    return NextResponse.json({
      status: "error",
      error: "Invalid request params",
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json({
      status: 500,
      error: "Internal Server Error",
    });
  }
}
