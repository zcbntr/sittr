import { NextRequest, NextResponse } from "next/server";
import { joinGroupFormSchema } from "~/lib/schema";
import { joinGroup } from "~/server/queries";

export async function PUT(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = joinGroupFormSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Create Pet Form Data Parse Error: \n" + formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const groupOrErrorMessage = await joinGroup(formData.data);

    if (typeof groupOrErrorMessage === "string") {
      return NextResponse.json({ error: groupOrErrorMessage });
    }

    return NextResponse.json(groupOrErrorMessage);
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
