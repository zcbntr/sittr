import { type NextRequest, NextResponse } from "next/server";
import { basicGetAPIFormSchema } from "~/lib/schemas";
import {
  getGroupById,
  getGroupsByIds,
  getGroupsUserIsIn,
} from "~/server/queries/groups";

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
        "Get Groups API Data Parse Error: \n" + requestParams.error.toString(),
      );
    }

    if (requestParams.data.all) {
      const groupsUserIsIn = await getGroupsUserIsIn();

      return NextResponse.json(groupsUserIsIn);
    } else if (requestParams.data.id) {
      const group = await getGroupById(requestParams.data.id);

      return NextResponse.json(group);
    } else if (requestParams.data.ids) {
      const groups = await getGroupsByIds(requestParams.data.ids);

      return NextResponse.json(groups);
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
