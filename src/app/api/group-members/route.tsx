import { type NextRequest, NextResponse } from "next/server";
import { basicGetAPIFormSchema, userToGroupSchema } from "~/lib/schemas";
import { getGroupMembers, removeUserFromGroup } from "~/server/queries";

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
      const membersOrErrorMessage = await getGroupMembers(
        requestParams.data.id,
      );

      if (typeof membersOrErrorMessage === "string") {
        return NextResponse.json({ error: membersOrErrorMessage });
      }

      return NextResponse.json(membersOrErrorMessage);
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

export async function DELETE(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = userToGroupSchema.safeParse(json);

    if (!formData.success) {
      throw new Error(
        "Remove User From Group Form Data Parse Error: \n" +
          formData.error.toString(),
      );
    }

    const userToGroupOrErrorMessage = await removeUserFromGroup(formData.data);

    if (typeof userToGroupOrErrorMessage === "string") {
      return NextResponse.json({ error: userToGroupOrErrorMessage });
    }

    return NextResponse.json(userToGroupOrErrorMessage);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
