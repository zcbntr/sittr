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
        { status: "success", data: [petOrErrorMessage] },
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
