import { type NextRequest, NextResponse } from "next/server";
import {
  basicGetAPIFormSchema,
  createGroupFormSchema,
  deleteAPIFormSchema,
} from "~/lib/schema";
import { groupSchema } from "~/lib/schema/groupschemas";
import {
  createGroup,
  deleteGroup,
  getGroupById,
  getGroupsByIds,
  getGroupsUserIsIn,
  updateGroup,
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

export async function PUT(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = createGroupFormSchema.safeParse(json);

    if (!formData.success) {
      throw new Error(
        "Create Pet Form Data Parse Error: \n" + formData.error.toString(),
      );
    }

    const groupOrErrorMessage = await createGroup(formData.data);

    if (typeof groupOrErrorMessage === "string") {
      return NextResponse.json({ error: groupOrErrorMessage });
    }

    return NextResponse.json(groupOrErrorMessage);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = groupSchema.safeParse(json);

    if (!formData.success) {
      throw new Error(
        "Edit Group Form Data Parse Error: \n" + formData.error.toString(),
      );
    }

    const groupOrErrorMessage = await updateGroup(formData.data);

    if (typeof groupOrErrorMessage === "string") {
      return NextResponse.json({ error: groupOrErrorMessage });
    }

    return NextResponse.json(groupOrErrorMessage);
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

    const formData = deleteAPIFormSchema.safeParse(json);

    if (!formData.success) {
      throw new Error(
        "Delete Group Form Data Parse Error: \n" + formData.error.toString(),
      );
    }

    const groupOrErrorMessage = await deleteGroup(formData.data.id);

    if (typeof groupOrErrorMessage === "string") {
      return NextResponse.json({ error: groupOrErrorMessage });
    }

    return NextResponse.json(groupOrErrorMessage);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
