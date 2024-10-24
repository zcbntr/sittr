import { type NextRequest, NextResponse } from "next/server";
import {
  basicGetAPIFormSchema,
  createGroupFormSchema,
  deleteAPIFormSchema,
  groupSchema,
} from "~/lib/schema";
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
    const requestParams = basicGetAPIFormSchema.safeParse({
      id: req.nextUrl.searchParams.get("id"),
      ids: req.nextUrl.searchParams.get("ids"),
      all: req.nextUrl.searchParams.get("all") === "true",
    });

    if (!requestParams.success) {
      console.log(
        "Get Subjects API Data Parse Error: \n" +
          requestParams.error.toString(),
      );
      throw new Error("Invalid request params");
    }

    if (requestParams.data.all) {
      const groupsIn = await getGroupsUserIsIn();
      return NextResponse.json(groupsIn);
    } else if (requestParams.data.id) {
      const group = await getGroupById(requestParams.data.id);
      return NextResponse.json(group);
    } else if (requestParams.data.ids) {
      const groups = await getGroupsByIds(requestParams.data.ids);

      return NextResponse.json(groups);
    }

    return NextResponse.json({ error: "Invalid request params" });
    // Todo - add else if for ids
  } catch (error) {
    return NextResponse.json({ error });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = createGroupFormSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Create Pet Form Data Parse Error: \n" + formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const group = await createGroup(formData.data);

    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ error });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = groupSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Edit Group Form Data Parse Error: \n" + formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRow = await updateGroup(formData.data);

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = deleteAPIFormSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Delete Group Form Data Parse Error: \n" + formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRow = await deleteGroup(formData.data.id);

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
