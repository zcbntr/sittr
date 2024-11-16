import { type NextRequest, NextResponse } from "next/server";
import { getTaskAPISchema, type Task, TaskType } from "~/lib/schemas/tasks";
import {
  getOwnedTaskById,
  getTasksOwnedInRange,
  getTasksVisibileInRange,
  getTasksSittingForInRange,
} from "~/server/queries/tasks";

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
      const taskOrErrorMessage = await getOwnedTaskById(requestParams.data.id);

      if (typeof taskOrErrorMessage === "string") {
        return NextResponse.json({ error: taskOrErrorMessage });
      }

      return NextResponse.json(taskOrErrorMessage);
    } else if (requestParams.data.dateRange) {
      let tasksInRange: Task[] = [];

      if (requestParams.data.type === TaskType.OWNED) {
        tasksInRange = await getTasksOwnedInRange(
          requestParams.data.dateRange.from,
          requestParams.data.dateRange.to,
        );
      } else if (requestParams.data.type === TaskType.ALL) {
        tasksInRange = await getTasksVisibileInRange(
          requestParams.data.dateRange.from,
          requestParams.data.dateRange.to,
        );
      } else if (requestParams.data.type === TaskType.SITTINGFOR) {
        tasksInRange = await getTasksSittingForInRange(
          requestParams.data.dateRange.from,
          requestParams.data.dateRange.to,
        );
      }

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
