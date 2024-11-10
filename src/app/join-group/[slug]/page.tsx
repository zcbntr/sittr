import JoinGroupPage from "./join-group-page";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;

  return <JoinGroupPage slug={slug} />;
}
