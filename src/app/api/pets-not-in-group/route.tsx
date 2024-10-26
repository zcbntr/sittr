import { type NextRequest, NextResponse } from "next/server";
import { basicGetAPIFormSchema } from "~/lib/schema";
import { getUsersPetsNotInGroup } from "~/server/queries";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const requestParams = basicGetAPIFormSchema.safeParse({
      id: req.nextUrl.searchParams.get("id"),
    });

    if (!requestParams.success) {
      console.log(
        "Pets not in group Form Data Parse Error: \n" + requestParams.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    if (requestParams.data.id) {
      const pets = await getUsersPetsNotInGroup(requestParams.data.id);

      return NextResponse.json(pets);
    }

    return NextResponse.json({ error: "Invalid request params" });
  } catch (error) {
    return NextResponse.json({ error });
  }
}
