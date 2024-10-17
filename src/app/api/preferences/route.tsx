import { type NextRequest, NextResponse } from "next/server";
import { userPreferencesSchema } from "~/lib/schema";
import {
  getCurrentUserPreferences,
  setUserPreferences,
} from "~/server/queries";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const ownerPreferences = await getCurrentUserPreferences();

    return NextResponse.json(ownerPreferences);
  } catch (error) {
    return NextResponse.json({ error });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const json: unknown = await req.json();

    const formData = userPreferencesSchema.safeParse(json);

    if (!formData.success) {
      console.log(
        "Set Owner Preferences Form Data Parse Error: \n" +
          formData.error.toString(),
      );
      throw new Error("Invalid form data");
    }

    const preferences = await setUserPreferences(formData.data);

    return NextResponse.json(preferences);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
