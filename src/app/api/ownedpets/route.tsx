import { NextResponse } from "next/server";
import { getOwnedPets } from "~/server/queries";

export async function GET(): Promise<NextResponse<unknown>> {
  try {
    const petsOrErrorMessage = await getOwnedPets();

    if (typeof petsOrErrorMessage === "string") {
      return NextResponse.json({ error: petsOrErrorMessage });
    }

    return NextResponse.json(petsOrErrorMessage);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
