import { Metadata } from "next";
import Link from "next/link";

import { getLoggedInUser } from "~/server/queries/users";

export const metadata: Metadata = {
  title: "Delete My Account",
};

export default async function SettingsPage() {
  const user = await getLoggedInUser();

  return (
    <div>
      <section>
        <div className="mx-auto flex max-w-md flex-col p-2">
          <h1 className="p-2 text-2xl">How do I delete my account?</h1>
          <p>
            If you no longer wish to use sittr, and are comfortable with losing
            all your data on the platform, you can delete your account via the
            {user && <Link href="/settings"> settings page</Link>}
            {!user && <span>settings page</span>}. When signed in, click your
            avatar in the top right and select &quot;Settings&quot;. From there,
            you can click &quot;Delete Account&quot; to permanently delete your
            account.
          </p>
        </div>
      </section>
    </div>
  );
}
