import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { groupInviteCodeSchema } from "~/lib/schemas/groups";
import { InviteApiError, joinGroup } from "~/server/queries/groups";

export const successSchema = z.object({
  status: z.literal("success"),
  data: groupInviteCodeSchema,
});

// Define your error schema using the enum values
export const errorSchema = z.object({
  status: z.literal("error"),
  errorType: z.nativeEnum(InviteApiError),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse<unknown>> {
  try {
    const slug = (await params).slug

    const groupOrErrorMessage = await joinGroup(slug);

    if (typeof groupOrErrorMessage === "string") {
      return NextResponse.json(
        { status: "error", error: groupOrErrorMessage },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { status: "success", data: groupOrErrorMessage },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { status: "error", error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
