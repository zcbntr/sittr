import { redirect } from "next/navigation";
import Onboarder from "../_components/onboarder";
import { userCompletedOnboarding } from "~/server/queries";

export default async function Onboarding() {
  const completedOnboarding = await userCompletedOnboarding();

  // If already onboarded redirect to dashboard
  if (completedOnboarding) {
    redirect("/");
  }

  return (
    <>
      <Onboarder />
    </>
  );
}
