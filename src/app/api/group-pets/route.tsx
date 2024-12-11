import { type NextRequest, NextResponse } from "next/server";
import { basicGetAPIFormSchema } from "~/lib/schemas";
import { getGroupPets } from "~/server/queries/groups";

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
      const groupPets = await getGroupPets(requestParams.data.id);

      return NextResponse.json(groupPets);
    }

    return NextResponse.json({ error: "Invalid request params" });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
