import { type NextRequest, NextResponse } from "next/server";
import { getSubjectsFormSchema } from "~/lib/schema";
import { getOwnedSubjects } from "~/server/queries";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
    try {
      const requestParams = getSubjectsFormSchema.safeParse({
        id: req.nextUrl.searchParams.get("id"),
        all: req.nextUrl.searchParams.get("all"),
      });
  
      if (!requestParams.success) {
        console.log(
          "Get Subjects API Data Parse Error: \n" + requestParams.error.toString(),
        );
        throw new Error("Invalid request params");
      }
  
      const pgRows = await getOwnedSubjects();
  
      return NextResponse.json(pgRows);
    } catch (error) {
      return NextResponse.json({ error });
    }
  }