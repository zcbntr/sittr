import Link from "next/link";
import { redirect } from "next/navigation";
import { getLoggedInUser } from "~/server/queries/users";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export default async function PlusUpgradeSuccess() {
  const user = await getLoggedInUser();

  if (!user?.plusMembership) {
    redirect("/plus");
  }

  return (
    <main className="m-5 mx-auto w-full max-w-xl p-5 text-center">
      <div className="mb-10 flex flex-col gap-5">
        <h1 className="mb-2 text-5xl font-extrabold">Thank you!</h1>
        <h3 className="text-2xl font-medium">
          You can now access all the features of{" "}
          <span className="font-bold">
            sittr
            <sup className="text-violet-600">+</sup>
          </span>
        </h3>
        <div className="mx-auto flex flex-row place-content-center text-pretty pl-12 pr-6 text-left sm:pl-16">
          <ul className="list-disc space-y-1 text-xl tracking-wide text-zinc-500">
            <li>Create unlimited pets</li>
            <li>Create unlimited groups</li>
            <li>Create unlimited tasks per week</li>
            <li>Upload up to 10 images to help sitters per task</li>
            <li>
              Your sitters can upload up to 10 images upon task completion
            </li>
            <li>And many more features.</li>
          </ul>
        </div>
        <div className="flex flex-row place-content-center">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "default" }), "max-w-36")}
          >
            <span className="text-lg">Try it out</span>
          </Link>
        </div>
        <div className="flex flex-row place-content-center">
          <div className="mt-4 max-w-96 align-middle text-sm text-zinc-500">
            <span className="font-medium">Your feedback matters.</span> Please{" "}
            <Link href="/support">contact support</Link> if you encounter any
            issues, want to suggest additional features, or are not satisfied
            with{" "}
            <span className="font-bold text-black">
              sittr
              <sup className="text-violet-600">+</sup>
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
