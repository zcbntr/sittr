import { getBasicLoggedInUser } from "~/server/queries/users";
import JoinGroupPage from "./join-group-page";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;

  const user = await getBasicLoggedInUser();

  if (!user) {
    redirect("sign-in?redirect=/join-group/" + slug);
  }

  return <JoinGroupPage slug={slug} />;
}
