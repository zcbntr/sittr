import { type NextRequest, NextResponse } from "next/server";
import { type CreateSittingFormInput } from "~/lib/schema";
import { createSittingRequest, getSittingRequestsInRange } from "~/server/queries";

export async function POST(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const formData: CreateSittingFormInput = await req.json();
    const pgRow = await createSittingRequest(formData.sittingType, formData.dateRange.from, formData.dateRange.to);

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const requestDetails = await req.json();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const from = new Date(requestDetails.dateRange.from);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    const to = new Date(requestDetails.dateRange.to);
    if (from && to) {
      const pgRow = await getSittingRequestsInRange(from, to);
      return NextResponse.json(pgRow);
    } else {
      throw new Error("Missing date range");
    }

  } catch (error) {
    return NextResponse.json({ error });
  }
}
