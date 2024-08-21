import { SignedIn, SignedOut } from "@clerk/nextjs";
import Dashboard from "./_components/dashboard";

export default function HomePage() {
  return (
    <>
      <SignedIn>
        <Dashboard />
      </SignedIn>
      <SignedOut>
        <HomePage />
      </SignedOut>
    </>
  );
}
