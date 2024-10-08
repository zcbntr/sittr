import { type NextRequest, NextResponse } from "next/server";
import { createTaskFormSchema } from "~/lib/schema";
import { createTask } from "~/server/queries";

export async function PUT(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = createTaskFormSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Create Task Form Data Parse Error: \n" + formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRow = await createTask(
      formData.data.name,
      formData.data.startDate,
      formData.data.endDate,
      formData.data.dueDate,
      formData.data.description,
    );

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
