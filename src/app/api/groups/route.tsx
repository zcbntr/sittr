import { type NextRequest, NextResponse } from "next/server";
import {
  basicGetAPIFormSchema,
} from "~/lib/schemas";
import {
  getGroupById,
  getGroupsByIds,
  getGroupsUserIsIn,
} from "~/server/queries";

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
      const groupsInOrErrorMessage = await getGroupsUserIsIn();

      if (typeof groupsInOrErrorMessage === "string") {
        return NextResponse.json({ error: groupsInOrErrorMessage });
      }

      return NextResponse.json(groupsInOrErrorMessage);
    } else if (requestParams.data.id) {
      const groupOrErrorMessage = await getGroupById(requestParams.data.id);

      if (typeof groupOrErrorMessage === "string") {
        return NextResponse.json({ error: groupOrErrorMessage });
      }

      return NextResponse.json(groupOrErrorMessage);
    } else if (requestParams.data.ids) {
      const groupsOrErrorMessage = await getGroupsByIds(requestParams.data.ids);

      if (typeof groupsOrErrorMessage === "string") {
        return NextResponse.json({ error: groupsOrErrorMessage });
      }

      return NextResponse.json(groupsOrErrorMessage);
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