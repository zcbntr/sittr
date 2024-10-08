import { type NextRequest, NextResponse } from "next/server";
import { createGroupFormSchema } from "~/lib/schema";
import { createGroup } from "~/server/queries";

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