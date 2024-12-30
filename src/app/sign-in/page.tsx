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
    <section className="bg-gradient-to-b from-violet-900 to-[#15162c] text-white">
      <div className="container flex min-h-screen flex-col items-center justify-center gap-12 px-4">
        <div className="mt-[-40px] sm:mt-[-180px]">
          <SignInOptions />
        </div>
      </div>
    </section>
  );
}
