import { type NextRequest } from "next/server";
import { deleteExpiredGroupInviteCodesAction } from "~/server/actions/group-actions";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  await deleteExpiredGroupInviteCodesAction();

  return Response.json({ success: true });
}
