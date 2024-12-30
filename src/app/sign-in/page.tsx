import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLoggedInUser } from "~/server/queries/users";
import { SignInOptions } from "../_components/sign-in-page/sign-in-options";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function LoginPage() {
  const user = await getLoggedInUser();

  if (user) {
    redirect("/");
  }

  return (
    <div>
      <section>
        <div className="mx-auto flex max-w-md flex-row place-content-center p-2">
          <SignInOptions />
        </div>
      </section>
    </div>
  );
}
