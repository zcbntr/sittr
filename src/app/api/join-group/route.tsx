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

    const groupOrError = await joinGroup(formData.data);

    return NextResponse.json(groupOrError);
  } catch (error) {
    return NextResponse.json({ UnexpectedError: error });
  }
}
