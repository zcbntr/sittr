import { Metadata } from "next";

import { getLoggedInUser } from "~/server/queries/users";
import SettingsPanel from "../_components/settings-page/settings-forms";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await getLoggedInUser();

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
