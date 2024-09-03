import { type NextRequest, NextResponse } from "next/server";
import { type OnboardingFormInput } from "~/lib/schema";
import { setUserPreferences } from "~/server/queries";

// Change this to be for sitting not onboarding
export async function POST(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const formData: OnboardingFormInput = await req.json();
    const pgRow = await setUserPreferences(
      formData.role == "Owner",
      formData.pet,
      formData.house,
      formData.baby,
      formData.plant,
    );

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
