import { type NextRequest, NextResponse } from "next/server";
import { basicGetAPIFormSchema, createGroupFormSchema } from "~/lib/schema";
import { createGroup, getGroupsIn } from "~/server/queries";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const requestParams = basicGetAPIFormSchema.safeParse({
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
      const groupsIn = await getGroupsIn();

      return NextResponse.json(groupsIn);
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

    const pgRow = await createGroup(
      formData.data.name,
      formData.data.sittingSubjects,
      formData.data.description,
    );

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
