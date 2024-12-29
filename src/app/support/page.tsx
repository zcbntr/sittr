import { Metadata } from "next";
import ContactSupportForm from "../_components/support-page/contact-support-form";
import { getLoggedInUser } from "~/server/queries/users";

export const metadata: Metadata = {
  title: "Support",
};

export default async function SupportPage() {
  const user = await getLoggedInUser();

  return (
    <section>
      <ContactSupportForm user={user}/>
    </section>
  );
}
