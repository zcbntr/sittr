"use client";

import Link from "next/link";
import { Button, buttonVariants } from "~/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          The <span className="text-[hsl(280,100%,70%)]">everything</span>{" "}
          Sitter
        </h1>
        <div className="flex flex-col gap-4">
          <div className="flex flex-row place-content-center">
            <span className="text-2xl">I want... </span>
          </div>

          <div className="flex flex-row gap-4">
            <Button asChild className="p-7 text-3xl">
              <Link href="/onboarding?role=owner">
                A Sitter
              </Link>
            </Button>
            <Button asChild className="p-7 text-3xl">
              <Link href="/onboarding?role=sitter">
                To Sit
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8"></div>
      </div>
    </main>
  );
}
