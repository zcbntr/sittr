import { SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import RoleSwapper from "~/components/roleswapper";

export function TopNav() {
  return (
    <header className="border-b border-[#e0e0e0] bg-[#f5f5f5] px-4 py-4 md:px-8">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-4xl font-bold" prefetch={false}>
          sittr
        </Link>
        <nav className="hidden items-center space-x-6 md:flex">
          <Link href="/support" className="hover:underline" prefetch={false}>
            Support
          </Link>
          <RoleSwapper />
          <div className="flex place-content-center">
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </nav>
        <Button variant="outline" size="sm" className="md:hidden">
          Menu
        </Button>
      </div>
    </header>
  );
}
