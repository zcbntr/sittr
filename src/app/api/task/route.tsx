import { type NextRequest, NextResponse } from "next/server";
import {
  createTaskFormSchema,
  dateRangeSchema,
  deleteFormSchema,
  taskSchema,
} from "~/lib/schema";
import {
  createTask,
  deleteTask,
  getOwnedTasksStartingInRange,
  updateTask,
} from "~/server/queries";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const requestParams = dateRangeSchema.safeParse({
      from: req.nextUrl.searchParams.get("from"),
      to: req.nextUrl.searchParams.get("to"),
    });

    if (!requestParams.success) {
      console.log(
        "Date Range Form Data Parse Error: \n" + requestParams.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRows = await getOwnedTasksStartingInRange(
      requestParams.data.from,
      requestParams.data.to,
    );

    return NextResponse.json(pgRows);
  } catch (error) {
    return NextResponse.json({ error });
  }
}

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
      formData.data.subjectId,
      formData.data.dueMode,
      formData.data.dateRange,
      formData.data.dueDate,
      formData.data.description,
    );

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = taskSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Edit Task Form Data Parse Error: \n" + formData.error.toString(),
      );
      console.log(json);
      throw new Error("Invalid form data");
    }

    const pgRow = await updateTask(
      formData.data.id,
      formData.data.name,
      formData.data.subjectId,
      formData.data.dueMode,
      formData.data.dateRange,
      formData.data.dueDate,
      formData.data.description,
    );

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = deleteFormSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Delete Task Form Data Parse Error: \n" + formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRow = await deleteTask(formData.data.id);

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
