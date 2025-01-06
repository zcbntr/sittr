import type { Metadata } from "next";
import ContactSupportForm from "../_components/support-page/contact-support-form";
import { getBasicLoggedInUser } from "~/server/queries/users";

export const metadata: Metadata = {
  title: "Support",
};

export default async function SupportPage() {
  const user = await getBasicLoggedInUser();

  return (
    <div>
      <section>
        <div className="mx-auto flex max-w-md flex-col p-2">
          <h1 className="p-2 text-2xl">Contact Support</h1>
          <ContactSupportForm user={user} />
        </div>
      </section>
    </div>
  );
}
