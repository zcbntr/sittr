import { NextResponse } from "next/server";
import { getOwnedPets } from "~/server/queries";

export async function GET(): Promise<NextResponse<unknown>> {
  try {
    const pets = await getOwnedPets();

    return NextResponse.json(pets);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
