import { getLoggedInUser } from "~/server/queries/users";
import PlusPurchaseForm from "../_components/account/plus-purchase-form";
import { redirect } from "next/navigation";

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
      <div className="mt-5 flex w-2/3 flex-col">
        <div className="">Get Sittr Plus</div>

        <PlusPurchaseForm />
      </div>
    </div>
  );
}
