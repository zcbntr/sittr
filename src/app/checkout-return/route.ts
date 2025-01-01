import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import Stripe from "stripe";
import { upgradeUserToPlus } from "~/server/actions/account-actions";
import { getBasicLoggedInUser } from "~/server/queries/users";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Stripe key is not defined");
}

const apiKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(apiKey);

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const stripeSessionId = searchParams.get("session_id");

  if (!stripeSessionId?.length) return redirect("/plus/get-plus");

  const session = await stripe.checkout.sessions.retrieve(stripeSessionId);

  if (session.status === "complete") {
    // Go to a success page!

    const user = await getBasicLoggedInUser();

    if (!user) {
      console.error(
        "User not found. Urgently fix this, user has paid for sittr plus but not upgraded.",
      );
      throw new Error("User not found. Contact support.");
    }

    await upgradeUserToPlus(user.id);

    return redirect(`/plus-upgrade-success`);
  }

  if (session.status === "open") {
    // Here you'll likely want to head back to some pre-payment page in your checkout
    // so the user can try again
    return redirect(`/plus`);
  }

  return redirect("/plus");
};
