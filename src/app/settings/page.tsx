import { type Metadata } from "next";
import { getLoggedInUser } from "~/server/queries/users";
import SettingsPanel from "../_components/settings-page/settings-forms";
import { markNotificationAsReadAction } from "~/server/actions/notification-actions";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getLoggedInUser();

  const notification = (await searchParams).notification;

  if (notification) {
    if (notification.length >= 0) {
      throw new Error("Invalid notification");
    }

    await markNotificationAsReadAction(notification.toString());
  }

  return (
    <div>
      <section>
        <div className="mx-auto flex max-w-md flex-col p-2">
          <h1 className="p-2 text-2xl">Settings</h1>
          <SettingsPanel user={user} />
        </div>
      </section>
    </div>
  );
}
