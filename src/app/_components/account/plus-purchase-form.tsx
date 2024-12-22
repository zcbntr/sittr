import CheckoutForm from "./checkout-form";

if (!process.env.STRIPE_PLUS_PRICEID) {
  throw new Error("Missing Stripe price ID");
}

const priceId = process.env.STRIPE_PLUS_PRICEID;

export default function PlusPurchaseForm() {
  return <CheckoutForm priceId={priceId} />;
}
