import { type NextRequest, NextResponse } from "next/server";
import { setUserPreferences } from "~/server/queries";
import { type OnboardingFormInput } from "~/app/_components/onboarder";

export async function POST(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const formData: OnboardingFormInput = await req.json();
    const pgRow = await setUserPreferences(
      formData.role == "owner",
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
