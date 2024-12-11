import { NextResponse } from "next/server";
import { getOwnedPets } from "~/server/queries/pets";

export async function GET(): Promise<NextResponse<unknown>> {
  try {
    const pets = await getOwnedPets();

    return NextResponse.json(pets);
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
