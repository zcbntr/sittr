import { type NextRequest, NextResponse } from "next/server";
import { onboardingPreferencesFormSchema, type OnboardingFormInput } from "~/lib/schema";
import { setUserOwnerPreferences } from "~/server/queries";

export async function POST(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = onboardingPreferencesFormSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Set Owner Preferences Form Data Parse Error: \n" + formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const pgRow = await setUserOwnerPreferences(formData.data);

    return NextResponse.json(pgRow);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
