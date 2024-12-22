import { getLoggedInUser } from "~/server/queries/users";
import PlusPurchaseForm from "../../_components/account/plus-purchase-form";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Page({}) {
  const user = await getLoggedInUser();

  if (!user) {
    return null;
  }

  if (user.plusMembership) {
    // Redirect to account page
    redirect("/account");
  }

  return (
    <div className="flex flex-row place-content-center">
      <div className="flex w-5/6 py-5 flex-col gap-3">
        <div className="text-3xl">
          Get{" "}
          <span className="font-bold">
            sittr
            <sup className="text-violet-600">+</sup>
          </span>{" "}
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

        <PlusPurchaseForm />
      </div>
    </div>
  );
}
