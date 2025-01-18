import { getBasicLoggedInUser } from "~/server/queries/users";
import { redirect } from "next/navigation";
import Link from "next/link";
import { type Metadata } from "next";
import ProPurchaseForm from "../_components/account/pro-purchase-form";

export const metadata: Metadata = {
  title: "Get sittr Pro",
};

export default async function Page({}) {
  const user = await getBasicLoggedInUser();

  if (!user) {
    redirect("/sign-in?redirect=/get-pro");
  }

  if (user.plan === "Plus") {
    // Redirect to comparison page
    redirect("/compare-plans");
  } else if (user.plan === "Pro") {
    // Redirect to thank you page
    redirect("/plus-upgrade-success");
  }

  return (
    <div className="flex h-96 grow flex-row place-content-center">
      <div className="flex h-full max-w-3xl flex-col place-content-center gap-3 py-5 text-2xl font-semibold">
        Pro is not available at this time.
      </div>
    </div>
  );

  return (
    <div className="flex flex-row place-content-center">
      <div className="flex w-full max-w-3xl flex-col gap-3 py-5">
        <div className="text-3xl">
          Get{" "}
          <span className="font-bold">
            sittr
            <span className="text-violet-600">Pro</span>
          </span>
        </div>

        <div>
          Get lifetime access for a one off fee. The price may change in the
          future, and the current price reflects the early state of sittr.
          Please{" "}
          <Link href="/support" className="underline">
            contact support
          </Link>{" "}
          if you have any questions.
        </div>

        <ProPurchaseForm />

        <div className="mt-2 flex flex-row place-content-center">
          <div className="max-w-96 align-middle text-sm text-zinc-500">
            <span className="font-medium">Your feedback matters.</span> Please{" "}
            <Link href="/support" className="underline">
              contact support
            </Link>{" "}
            if you encounter any issues, want to suggest additional features, or
            are not satisfied with{" "}
            <span className="font-bold text-black">
              sittr
              <span className="text-violet-600">Pro</span>
            </span>
            . You have 14 days to request a refund.
          </div>
        </div>
      </div>
    </div>
  );
}
