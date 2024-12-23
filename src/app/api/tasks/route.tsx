import { type NextRequest, NextResponse } from "next/server";
import { getTaskAPISchema, type SelectBasicTask } from "~/lib/schemas/tasks";
import { getOwnedTaskById, getTasksInRange } from "~/server/queries/tasks";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const requestParams = getTaskAPISchema.safeParse({
      id: req.nextUrl.searchParams.get("id"),
      ids: req.nextUrl.searchParams.get("ids"),
      dateRange: {
        from: req.nextUrl.searchParams.get("from"),
        to: req.nextUrl.searchParams.get("to"),
      },
      type: req.nextUrl.searchParams.get("type"),
    });

    if (!requestParams.success) {
      throw new Error(
        "Get Tasks Params Parse Error: \n" + requestParams.error.toString(),
      );
    }

    if (requestParams.data.id) {
      const task = await getOwnedTaskById(requestParams.data.id);

      return NextResponse.json(task);
    } else if (requestParams.data.dateRange) {
      const tasksInRange: SelectBasicTask[] = await getTasksInRange(
        requestParams.data.dateRange.from,
        requestParams.data.dateRange.to,
        requestParams.data.type,
      );

      return NextResponse.json(tasksInRange);
    } else if (requestParams.data.ids) {
      return NextResponse.json({
        error: "Request type not currently supported",
      });
    }

    return NextResponse.json({ error: "Request type not currently supported" });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
