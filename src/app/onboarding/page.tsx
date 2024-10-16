import { redirect } from "next/navigation";
import Onboarder from "../_components/onboarder";
import { currentUserCompletedOnboarding } from "~/server/queries";

export default async function Onboarding() {
  const completedOnboarding = await currentUserCompletedOnboarding();

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
