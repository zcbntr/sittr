"use client";

import { SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { MdGroups, MdPets } from "react-icons/md";

export function TopNav() {
  return (
    <header className="border-b border-[#e0e0e0] bg-[#f5f5f5] px-4 py-4 md:px-8">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-4xl font-bold" prefetch={false}>
          sittr
        </Link>
        <nav className="hidden items-center space-x-6 md:flex">
          {/* <RoleSwapper /> */}
          <div className="flex place-content-center">
            <SignedIn>
              <UserButton
                userProfileMode="navigation"
                userProfileUrl="/user-profile"
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="My Groups"
                    labelIcon={
                      <div className="flex flex-row place-content-center">
                        <MdGroups size="1.5em" />
                      </div>
                    }
                    href="/my-groups"
                  ></UserButton.Link>
                  <UserButton.Link
                    label="My Pets"
                    labelIcon={
                      <div className="flex flex-row place-content-center">
                        <MdPets size="1.5em" />
                      </div>
                    }
                    href="/my-pets"
                  ></UserButton.Link>
                </UserButton.MenuItems>
              </UserButton>
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
