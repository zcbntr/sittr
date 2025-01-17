import CheckoutForm from "./checkout-form";

if (!process.env.STRIPE_PRO_PRICEID) {
  throw new Error("Missing Stripe price ID");
}

const priceId = process.env.STRIPE_PRO_PRICEID;

export default function ProPurchaseForm() {
  return <CheckoutForm priceId={priceId} />;
}
