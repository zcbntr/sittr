import { SignedIn, SignedOut } from "@clerk/nextjs";
import Dashboard from "./_components/dashboard";
import Home from "./_components/homepage";

export default function HomePage() {
  return (
    <>
      <SignedIn>
        <Dashboard />
      </SignedIn>
      <SignedOut>
        <Home />
      </SignedOut>
    </>
  );
}
