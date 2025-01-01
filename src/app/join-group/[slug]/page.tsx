import { getBasicLoggedInUser } from "~/server/queries/users";
import JoinGroupPage from "./join-group-page";
import { signIn } from "~/auth";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;

  const user = await getBasicLoggedInUser();

  if (!user) {
    // Hope this works!
    await signIn("google");
    return <div></div>;
  }

  return <JoinGroupPage slug={slug} />;
}
