import { type NextRequest, NextResponse } from "next/server";
import { basicGetAPIFormSchema } from "~/lib/schema";
import { getUsersPetsNotInGroup } from "~/server/queries";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const requestParams = basicGetAPIFormSchema.safeParse({
      id: searchParams.get("id"),
    });

    if (!requestParams.success) {
      throw new Error(
        "Pets not in group Form Data Parse Error: \n" +
          requestParams.error.toString(),
      );
    }

    if (requestParams.data.id) {
      const petsOrErrorMessage = await getUsersPetsNotInGroup(
        requestParams.data.id,
      );

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
