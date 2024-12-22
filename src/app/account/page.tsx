import { redirect } from "next/navigation";
import { getLoggedInUser } from "~/server/queries/users";
import { markNotificationAsReadAction } from "~/server/actions/notification-actions";
import AccountPage from "../_components/account/account-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getLoggedInUser();
  if (!user) {
    redirect("/");
  }

  const notification = (await searchParams).notification;

  if (notification) {
    if (notification.length >= 0) {
      throw new Error("Invalid notification");
    }

    await markNotificationAsReadAction(notification.toString());
  }

  return <AccountPage user={user} />;
}
