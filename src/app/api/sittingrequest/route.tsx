import { type NextRequest, NextResponse } from "next/server";
import { editSittingRequestFormSchema, dateRangeSchema, createSittingRequestFormSchema } from "~/lib/schema";
import {
  createSittingRequest,
  getSittingRequestsStartingInRange,
  updateSittingRequest,
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

    const pgRows = await getSittingRequestsStartingInRange(
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

    const formData = createSittingRequestFormSchema.safeParse(json);

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

export async function PATCH(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = editSittingRequestFormSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Edit Sitting Request Form Data Parse Error: \n" +
          formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRow = await updateSittingRequest(
      formData.data.id,
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