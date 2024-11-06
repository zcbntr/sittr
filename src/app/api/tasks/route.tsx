import { type NextRequest, NextResponse } from "next/server";
import {
  basicGetAPIFormSchemaWithDateRange,
} from "~/lib/schemas";
import {
  getOwnedTaskById,
  getVisibleTasksInRange,
} from "~/server/queries/tasks";

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
      throw new Error(
        "Get Tasks Params Parse Error: \n" + requestParams.error.toString(),
      );
    }

    if (requestParams.data.id) {
      const taskOrErrorMessage = await getOwnedTaskById(requestParams.data.id);

      if (typeof taskOrErrorMessage === "string") {
        return NextResponse.json({ error: taskOrErrorMessage });
      }

      return NextResponse.json(taskOrErrorMessage);
    } else if (requestParams.data.dateRange) {
      const tasksInRangeOrErrorMessage = await getVisibleTasksInRange(
        requestParams.data.dateRange.from,
        requestParams.data.dateRange.to,
      );

      if (typeof tasksInRangeOrErrorMessage === "string") {
        return NextResponse.json({ error: tasksInRangeOrErrorMessage });
      }

      return NextResponse.json(tasksInRangeOrErrorMessage);
    }

    return NextResponse.json({ error: "Request type not currently supported" });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
