import { type NextRequest, NextResponse } from "next/server";
import { getSubjectsFormSchema } from "~/lib/schema";
import { getOwnedSubjects } from "~/server/queries";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const requestParams = getSubjectsFormSchema.safeParse({
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
      const pgRows = await getOwnedSubjects();

      return NextResponse.json(pgRows);
    }

    return NextResponse.json({ error: "Invalid request params" });
    // Todo - add else if for ids
  } catch (error) {
    return NextResponse.json({ error });
  }
}
