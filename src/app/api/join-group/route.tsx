import { type NextRequest, NextResponse } from "next/server";
import { joinGroupFormSchema } from "~/lib/schema";
import { joinGroup } from "~/server/queries";

export async function PUT(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = joinGroupFormSchema.safeParse(json);

    if (!formData.success) {
      throw new Error(
        "Join Group Form Data Parse Error: \n" + formData.error.toString(),
      );
    }

    const groupOrErrorMessage = await joinGroup(formData.data);

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
