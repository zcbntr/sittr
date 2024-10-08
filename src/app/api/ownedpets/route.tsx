import { NextRequest, NextResponse } from "next/server";
import { getOwnedPets } from "~/server/queries";

export async function GET(req: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const pgRows = await getOwnedPets();

    return NextResponse.json(pgRows);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
