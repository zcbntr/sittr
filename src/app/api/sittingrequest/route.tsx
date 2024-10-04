import { type NextRequest, NextResponse } from "next/server";
import { createSittingFormSchema } from "~/lib/schema";
import { createSittingRequest, getSittingRequestsInRange } from "~/server/queries";

export async function POST(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    // This is the problem line - it throws an error and ends the try block
    const formData = createSittingFormSchema.safeParse(json);

    if (!formData.success) {
      console.log("Create Sitting Request Form Data Parse Error: \n" + formData.error.toString());
      throw new Error("Invalid form data");
    }

    const pgRow = await createSittingRequest(formData.data.name, formData.data.sittingType, formData.data.dateRange.from, formData.data.dateRange.to);

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const requestDetails: unknown = await req.json();
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
