import Link from "next/link";

export default function Homepage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          The <span className="text-[hsl(280,100%,70%)]">everything</span>{" "}
          Sitter
        </h1>
        <div>
          I want
          <Link href="/onboarding?role=owner">sitting</Link>
          <Link href="/onboarding?role=sitter">to sit</Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8"></div>
      </div>
    </main>
  );
}
