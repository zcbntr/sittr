import { type NextRequest, NextResponse } from "next/server";
import { createSittingFormSchema, dateRangeSchema } from "~/lib/schema";
import {
  createSittingRequest,
  getSittingRequestsStartingInRange,
} from "~/server/queries";

export async function PUT(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    // This is the problem line - it throws an error and ends the try block
    const formData = createSittingFormSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Create Sitting Request Form Data Parse Error: \n" +
          formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRow = await createSittingRequest(
      formData.data.name,
      formData.data.sittingType,
      formData.data.dateRange.from,
      formData.data.dateRange.to,
    );

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}

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

    console.log(requestParams.data);

    const pgRows = await getSittingRequestsStartingInRange(
      requestParams.data.from,
      requestParams.data.to,
    );

    return NextResponse.json(pgRows);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
