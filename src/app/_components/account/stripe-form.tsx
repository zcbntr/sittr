"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { convertToSubCurrency } from "~/lib/utils";
import CheckoutPage from "./checkout-page";

if (process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY === undefined) {
  throw new Error("Stripe public key is not defined");
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

const amount = 17.99;

export default function PlusPurchaseForm() {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: "payment",
        amount: convertToSubCurrency(amount),
        currency: "gbp",
      }}
    >
      <CheckoutPage amount={amount} />
    </Elements>
  );
}
