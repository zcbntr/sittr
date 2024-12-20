import { type NextRequest } from "next/server";
import { notifyOfPetBirthdays } from "~/server/actions/cron-jobs";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  await notifyOfPetBirthdays();

  return Response.json({ success: true });
}
