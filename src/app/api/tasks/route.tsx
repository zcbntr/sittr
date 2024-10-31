import { type NextRequest, NextResponse } from "next/server";
import {
  basicGetAPIFormSchemaWithDateRange,
  createTaskSchema,
  deleteAPIFormSchema,
  taskSchema,
} from "~/lib/schema";
import {
  createTask,
  deleteOwnedTask,
  getOwnedTask,
  getVisibleTasksInRange,
  updateTask,
} from "~/server/queries";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const requestParams = basicGetAPIFormSchemaWithDateRange.safeParse({
      id: req.nextUrl.searchParams.get("id"),
      ids: req.nextUrl.searchParams.get("ids"),
      all: req.nextUrl.searchParams.get("all") === "true",
      dateRange: {
        from: req.nextUrl.searchParams.get("from"),
        to: req.nextUrl.searchParams.get("to"),
      },
    });

    if (!requestParams.success) {
      console.log(
        "GET Request URL Params Parse Error: \n" +
          requestParams.error.toString(),
      );
      throw new Error("Invalid URL params");
    }

    if (requestParams.data.id) {
      const task = await getOwnedTask(requestParams.data.id);

      if (!task) {
        return NextResponse.json({ error: "Task not found" });
      }

      return NextResponse.json(task);
    }

    if (requestParams.data.dateRange) {
      const pgRows = await getVisibleTasksInRange(
        requestParams.data.dateRange.from,
        requestParams.data.dateRange.to,
      );

      return NextResponse.json(pgRows);
    }

    return NextResponse.json({ error: "Request type not currently supported" });
  } catch (error) {
    return NextResponse.json({ error });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = createTaskSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Create Task Form Data Parse Error: \n" + formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRow = await createTask(formData.data);

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

    const pgRow = await updateTask(formData.data);

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = deleteAPIFormSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Delete Task Form Data Parse Error: \n" + formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRow = await deleteOwnedTask(formData.data.id);

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
