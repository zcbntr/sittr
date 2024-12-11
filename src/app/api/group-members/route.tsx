import { type NextRequest, NextResponse } from "next/server";
import { basicGetAPIFormSchema } from "~/lib/schemas";
import { getGroupMembers } from "~/server/queries/groups";

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
        "Group Members Form Data Parse Error: \n" +
          requestParams.error.toString(),
      );
    }

    if (requestParams.data.id) {
      const groupMembers = await getGroupMembers(requestParams.data.id);

      return NextResponse.json(groupMembers);
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
